// Webhook do Mercado Pago — recebe a notificação quando o status de um
// pagamento muda (ex: boleto compensou) e atualiza o pedido no Firestore.
//
// Configuração necessária no painel do Mercado Pago (Suas integrações >
// Notificações > Webhooks): URL = https://<seu-dominio>/api/mp-webhook,
// evento "Pagamentos". O MP mostra uma "Assinatura secreta" — copie e
// salve como variável de ambiente MP_WEBHOOK_SECRET na Vercel.
//
// Nunca confiamos no corpo da notificação em si (pode ser forjado) —
// sempre buscamos o pagamento de verdade na API do Mercado Pago usando
// nosso próprio access token antes de agir.

import crypto from 'crypto';
import { getFirestoreAccessToken, fsRunQuery, fsPatch } from './_lib/firestore.js';
import { sendEmail, emailWrapper } from './_lib/brevo.js';

function verifyMpSignature(xSignature, xRequestId, dataId, secret) {
  if (!xSignature || !xRequestId || !secret) return false;
  const parts = {};
  xSignature.split(',').forEach((p) => {
    const [k, v] = p.split('=');
    if (k && v) parts[k.trim()] = v.trim();
  });
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end();

  // O Mercado Pago manda o id do pagamento tanto via query string
  // (formato antigo: ?topic=payment&id=X, ou ?data.id=X) quanto no corpo
  // (formato atual: { action: 'payment.updated', data: { id: 'X' } }).
  const dataId = req.query['data.id'] || req.query.id || req.body?.data?.id;
  if (!dataId) return res.status(200).json({ ok: true });

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret) {
    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];
    if (!verifyMpSignature(xSignature, xRequestId, String(dataId).toLowerCase(), secret)) {
      console.warn('mp-webhook: assinatura inválida, ignorando notificação para id', dataId);
      return res.status(200).json({ ok: true });
    }
  } else {
    console.warn('mp-webhook: MP_WEBHOOK_SECRET não configurada — pulando verificação de assinatura');
  }

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const payment = await mpRes.json();
    if (!mpRes.ok || !payment.id) return res.status(200).json({ ok: true });

    const token = await getFirestoreAccessToken();
    const matches = await fsRunQuery(token, 'pedidos', 'mercadoPago.id', String(payment.id), 1);
    if (!matches.length) return res.status(200).json({ ok: true });

    const pedido = matches[0];
    const jaConfirmado = pedido.pagamentoConfirmado === true;

    const updates = { 'mercadoPago.status': payment.status };
    if (payment.status === 'approved' && !jaConfirmado) {
      updates.pagamentoConfirmado = true;
      updates.pagamentoConfirmadoEm = new Date().toISOString();
      if ((pedido.status || 'novo') === 'novo') updates.status = 'processando';
    }
    await fsPatch(token, 'pedidos', pedido._id, updates);

    if (payment.status === 'approved' && !jaConfirmado && pedido.pagamento === 'boleto') {
      await enviarEmailPagamentoConfirmado(pedido);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('mp-webhook erro:', err);
    // Responde 200 mesmo em erro interno pra evitar retentativas infinitas
    // do Mercado Pago sobre uma notificação que já causou o erro.
    return res.status(200).json({ ok: true });
  }
}

async function enviarEmailPagamentoConfirmado(pedido) {
  const email = pedido.cliente?.email;
  if (!email) return;
  const primeiroNome = (pedido.cliente?.nome || 'Cliente').split(' ')[0];
  const numero = pedido.numeroPedido;

  const html = emailWrapper('Pagamento confirmado! ✅', `
    <p style="font-size:14px;color:#5A4030;line-height:1.8;margin:0 0 16px;">Olá, <strong>${primeiroNome}</strong>!</p>
    <p style="font-size:14px;color:#5A4030;line-height:1.8;margin:0 0 16px;">Boa notícia: recebemos a confirmação do pagamento do boleto do seu pedido <strong>${numero}</strong>!</p>
    <div style="background:#F0F9F4;border-left:3px solid #2D6A4F;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#1A4731;line-height:1.8;">
        ✅ Pagamento compensado<br>
        📦 Já estamos preparando sua semijoia com todo o cuidado<br>
        📧 Você receberá o código de rastreio assim que ela for enviada
      </p>
    </div>
    <p style="font-size:14px;color:#5A4030;line-height:1.8;margin:0;">Obrigada pela confiança — é uma alegria preparar essa peça para você.</p>
  `);

  try {
    await sendEmail({
      to: email,
      toName: pedido.cliente?.nome,
      subject: `✅ Pagamento confirmado — Pedido ${numero}`,
      htmlContent: html,
    });
  } catch (e) {
    console.error('Erro ao enviar e-mail de pagamento confirmado:', e);
  }
}
