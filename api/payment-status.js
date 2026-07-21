// Consulta leve de status de pagamento, usada pelo checkout para detectar
// em tempo real quando o Pix foi confirmado (sem precisar dar F5).
// Devolve só o mínimo necessário — nunca dados pessoais do pedido.

import { getFirestoreAccessToken, fsRunQuery } from './_lib/firestore.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const pedido = String(req.query.pedido || '').trim();
  if (!pedido) return res.status(400).json({ error: 'Parâmetro pedido obrigatório' });

  try {
    const token = await getFirestoreAccessToken();
    const matches = await fsRunQuery(token, 'pedidos', 'numeroPedido', pedido, 1);
    if (!matches.length) return res.status(200).json({ pagamentoConfirmado: false, status: null });
    const p = matches[0];
    return res.status(200).json({
      pagamentoConfirmado: !!p.pagamentoConfirmado,
      status: p.status || 'novo',
    });
  } catch (err) {
    console.error('payment-status erro:', err);
    return res.status(200).json({ pagamentoConfirmado: false, status: null });
  }
}
