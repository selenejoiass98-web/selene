// Lista e dispara campanhas de e-mail já criadas no painel do Brevo.
//
// Importante: a API do Brevo NÃO permite escolher destinatários na hora do
// disparo — o "sendNow" sempre envia pra lista que já foi configurada
// dentro da própria campanha, no painel do Brevo. Este endpoint só serve
// pra listar as campanhas prontas (rascunho) e disparar a que for
// escolhida, sem precisar abrir o painel do Brevo pra isso.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const BREVO_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_KEY) return res.status(500).json({ error: 'Chave Brevo não configurada' });

  if (req.method === 'GET') {
    try {
      const brevoRes = await fetch('https://api.brevo.com/v3/emailCampaigns?status=draft&limit=50&sort=desc', {
        headers: { 'api-key': BREVO_KEY },
      });
      const data = await brevoRes.json();
      if (!brevoRes.ok) return res.status(brevoRes.status).json(data);
      const campanhas = (data.campaigns || []).map((c) => ({
        id: c.id,
        nome: c.name,
        assunto: c.subject,
        status: c.status,
      }));
      return res.status(200).json({ campanhas });
    } catch (err) {
      console.error('brevo-campaigns GET erro:', err);
      return res.status(500).json({ error: 'Erro ao buscar campanhas' });
    }
  }

  if (req.method === 'POST') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Campo id obrigatório' });
    try {
      const brevoRes = await fetch(`https://api.brevo.com/v3/emailCampaigns/${id}/sendNow`, {
        method: 'POST',
        headers: { 'api-key': BREVO_KEY },
      });
      if (brevoRes.ok) return res.status(200).json({ success: true });
      const data = await brevoRes.json().catch(() => ({}));
      return res.status(brevoRes.status).json(data);
    } catch (err) {
      console.error('brevo-campaigns POST erro:', err);
      return res.status(500).json({ error: 'Erro ao disparar campanha' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
