// Números de busca do Google (Search Console) pro dashboard do admin —
// cliques, impressões, CTR e posição média dos últimos 28 dias.
//
// Setup necessário (feito uma vez):
//  1) No Search Console (search.google.com/search-console), em "Usuários e
//     permissões" da propriedade, adicione o e-mail da conta de serviço
//     (o "client_email" dentro do JSON salvo em FIREBASE_SERVICE_ACCOUNT)
//     como usuário com acesso "Restrito" (leitura já basta).
//  2) No Google Cloud Console, no mesmo projeto da conta de serviço,
//     ative a API "Search Console API".
//  3) Configure a variável de ambiente GSC_SITE_URL na Vercel com o valor
//     EXATO da propriedade como aparece no Search Console — se for
//     propriedade de domínio: "sc-domain:elenicecollection.com.br"; se for
//     propriedade de URL: algo como "https://www.elenicecollection.com.br/".

import { getGoogleAccessToken } from './_lib/google-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const siteUrl = process.env.GSC_SITE_URL;
  if (!siteUrl) return res.status(200).json({ configured: false });

  try {
    const token = await getGoogleAccessToken('https://www.googleapis.com/auth/webmasters.readonly');

    // O Search Console tem alguns dias de atraso nos dados mais recentes.
    const end = new Date();
    end.setDate(end.getDate() - 3);
    const start = new Date(end);
    start.setDate(start.getDate() - 28);
    const fmt = (d) => d.toISOString().slice(0, 10);

    const gscRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end) }),
      }
    );
    const data = await gscRes.json();
    if (!gscRes.ok) {
      console.error('search-console-stats: erro da API do Google:', data);
      return res.status(200).json({ configured: true, error: true });
    }

    const row = (data.rows && data.rows[0]) || {};
    return res.status(200).json({
      configured: true,
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
      periodo: `${fmt(start)} a ${fmt(end)}`,
    });
  } catch (err) {
    console.error('search-console-stats erro:', err);
    return res.status(200).json({ configured: true, error: true });
  }
}
