// Cron diário (ver vercel.json) — varre pedidos com boleto ainda não pago
// cujo vencimento já passou e, pra cada um (só uma vez, controlado por
// avisoVencimentoEnviado):
//   1) avisa o admin (com link de WhatsApp pronto pra falar com a cliente)
//   2) avisa a cliente, propondo finalizar a compra com outra forma de pagamento
//
// Protegido pelo cabeçalho que a própria Vercel envia nas chamadas de cron
// quando a env var CRON_SECRET está configurada.

import { getFirestoreAccessToken, fsRunQuery, fsPatch } from './_lib/firestore.js';
import { sendEmail, emailWrapper } from './_lib/brevo.js';

const ADMIN_EMAIL = 'contato@elenicecollection.com.br';
const WHATSAPP_LOJA = '5547997259678';

function formatWhatsappLink(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return null;
  const withCountry = digits.startsWith('55') ? digits : '55' + digits;
  return `https://wa.me/${withCountry}`;
}

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers['authorization'];
    if (auth !== `Bearer ${cronSecret}`) return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const token = await getFirestoreAccessToken();
    const candidatos = await fsRunQuery(token, 'pedidos', 'status', 'novo', 200);
    const agora = Date.now();
    let avisados = 0;

    for (const pedido of candidatos) {
      if (pedido.pagamento !== 'boleto') continue;
      if (pedido.pagamentoConfirmado === true) continue;
      if (pedido.avisoVencimentoEnviado === true) continue;
      if (!pedido.vencimento) continue;

      const venc = new Date(pedido.vencimento).getTime();
      if (isNaN(venc) || venc > agora) continue;

      await Promise.all([
        enviarEmailAdminBoletoVencido(pedido),
        enviarEmailClienteBoletoVencido(pedido),
      ]);

      await fsPatch(token, 'pedidos', pedido._id, {
        avisoVencimentoEnviado: true,
        avisoVencimentoEnviadoEm: new Date().toISOString(),
      });
      avisados++;
    }

    return res.status(200).json({ ok: true, verificados: candidatos.length, avisados });
  } catch (err) {
    console.error('check-boletos erro:', err);
    return res.status(500).json({ error: 'erro interno' });
  }
}

async function enviarEmailAdminBoletoVencido(pedido) {
  const numero = pedido.numeroPedido;
  const nome = pedido.cliente?.nome || '—';
  const email = pedido.cliente?.email || '—';
  const telefone = pedido.cliente?.telefone || '';
  const total = Number(pedido.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const vencStr = new Date(pedido.vencimento).toLocaleDateString('pt-BR');
  const waLink = formatWhatsappLink(telefone);

  const html = emailWrapper('⚠️ Boleto vencido sem pagamento', `
    <p style="font-size:14px;color:#5A4030;line-height:1.8;margin:0 0 16px;">O boleto do pedido abaixo venceu em <strong>${vencStr}</strong> e ainda não foi pago. Considere entrar em contato com a cliente.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;font-size:13px;color:#2A1F14;">
      <tr><td style="padding:6px 0;color:#9C8070;">Pedido</td><td style="padding:6px 0;text-align:right;"><strong>${numero}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#9C8070;">Cliente</td><td style="padding:6px 0;text-align:right;">${nome}</td></tr>
      <tr><td style="padding:6px 0;color:#9C8070;">E-mail</td><td style="padding:6px 0;text-align:right;">${email}</td></tr>
      <tr><td style="padding:6px 0;color:#9C8070;">Telefone</td><td style="padding:6px 0;text-align:right;">${telefone || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#9C8070;">Valor</td><td style="padding:6px 0;text-align:right;"><strong>R$ ${total}</strong></td></tr>
    </table>
    ${waLink ? `
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${waLink}" target="_blank" style="display:inline-block;background:#2D6A4F;color:#fff;font-family:Georgia,serif;font-size:14px;letter-spacing:1px;padding:14px 32px;text-decoration:none;">FALAR COM A CLIENTE NO WHATSAPP</a>
    </div>` : ''}
    <p style="font-size:12px;color:#9C8070;margin:16px 0 0;">A cliente também já recebeu um e-mail propondo mudar a forma de pagamento — este aviso é só pra você acompanhar de perto.</p>
  `);

  await sendEmail({
    to: ADMIN_EMAIL,
    toName: 'Elenice Collection',
    subject: `⚠️ Boleto vencido — Pedido ${numero}`,
    htmlContent: html,
    bcc: false,
  });
}

async function enviarEmailClienteBoletoVencido(pedido) {
  const email = pedido.cliente?.email;
  if (!email) return;
  const primeiroNome = (pedido.cliente?.nome || 'Cliente').split(' ')[0];
  const numero = pedido.numeroPedido;
  const waLink = `https://wa.me/${WHATSAPP_LOJA}?text=${encodeURIComponent(`Olá! Meu boleto do pedido ${numero} venceu, gostaria de finalizar com outra forma de pagamento.`)}`;

  const html = emailWrapper('Seu boleto venceu — vamos resolver? 💛', `
    <p style="font-size:14px;color:#5A4030;line-height:1.8;margin:0 0 16px;">Olá, <strong>${primeiroNome}</strong>!</p>
    <p style="font-size:14px;color:#5A4030;line-height:1.8;margin:0 0 16px;">Notamos que o boleto do seu pedido <strong>${numero}</strong> venceu sem confirmação de pagamento. Sem problemas — isso acontece!</p>
    <p style="font-size:14px;color:#5A4030;line-height:1.8;margin:0 0 20px;">Se quiser, podemos gerar um novo boleto ou você pode finalizar com <strong>Pix</strong> ou <strong>cartão</strong>, o que for mais fácil pra você agora.</p>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${waLink}" target="_blank" style="display:inline-block;background:#3D2B1A;color:#C4A47A;font-family:Georgia,serif;font-size:14px;letter-spacing:2px;padding:14px 32px;text-decoration:none;">FALAR COM A GENTE NO WHATSAPP</a>
    </div>
    <p style="font-size:12px;color:#9C8070;text-align:center;margin:12px 0 0;">Estamos aqui pra te ajudar a finalizar do jeito que for melhor.</p>
  `);

  await sendEmail({
    to: email,
    toName: pedido.cliente?.nome,
    subject: `Seu boleto venceu — pedido ${numero}`,
    htmlContent: html,
  });
}
