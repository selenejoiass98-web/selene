export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const BREVO_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_KEY) return res.status(500).json({ error: 'Chave Brevo não configurada' });

  const { to, toName, subject, htmlContent } = req.body;
  if (!to || !subject || !htmlContent) {
    return res.status(400).json({ error: 'Campos obrigatórios: to, subject, htmlContent' });
  }

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'Elenice Collection', email: 'contato@elenicecollection.com.br' },
        to: [{ email: to, name: toName || to }],
        bcc: [{ email: 'contato@elenicecollection.com.br', name: 'Elenice Collection' }],
        subject,
        htmlContent,
      })
    });

    const data = await brevoRes.json();
    if (!brevoRes.ok) return res.status(brevoRes.status).json(data);
    return res.status(200).json({ success: true, messageId: data.messageId });
  } catch(err) {
    console.error('Brevo error:', err);
    return res.status(500).json({ error: 'Erro ao enviar e-mail', details: err.message });
  }
}
