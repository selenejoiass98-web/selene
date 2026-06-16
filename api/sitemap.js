const PROJECT_ID = 'selene-joias';
const API_KEY = 'AIzaSyAsGGXCg0GfbJKsGuGDWDHfVpdeBna-aYI';
const SITE_URL = 'https://www.elenicecollection.com.br';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function fieldValue(field) {
  if (!field) return null;
  if ('stringValue' in field) return field.stringValue;
  if ('timestampValue' in field) return field.timestampValue;
  if ('booleanValue' in field) return field.booleanValue;
  return null;
}

async function fetchAllDocs(collectionName) {
  const docs = [];
  let pageToken = null;

  do {
    const url = `${FIRESTORE_BASE}/${collectionName}?key=${API_KEY}&pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    (data.documents || []).forEach(doc => {
      const id = doc.name.split('/').pop();
      const fields = {};
      Object.entries(doc.fields || {}).forEach(([key, val]) => { fields[key] = fieldValue(val); });
      docs.push({ id, ...fields });
    });
    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return docs;
}

function xmlEscape(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function urlTag({ loc, lastmod, priority }) {
  return `  <url><loc>${xmlEscape(loc)}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}<priority>${priority}</priority></url>`;
}

export default async function handler(req, res) {
  const urls = [
    { loc: `${SITE_URL}/`, priority: '1.0' },
    { loc: `${SITE_URL}/catalogo`, priority: '0.9' },
    { loc: `${SITE_URL}/sobre`, priority: '0.6' },
    { loc: `${SITE_URL}/blog`, priority: '0.8' },
    { loc: `${SITE_URL}/politica-de-entrega.html`, priority: '0.3' },
    { loc: `${SITE_URL}/politica-de-trocas-e-devolucoes.html`, priority: '0.3' },
    { loc: `${SITE_URL}/politica-de-privacidade.html`, priority: '0.3' },
  ];

  try {
    const produtos = await fetchAllDocs('produtos');
    produtos
      .filter(p => p.status === 'ativo')
      .forEach(p => urls.push({
        loc: `${SITE_URL}/produto.html?id=${p.id}`,
        lastmod: p.atualizadoEm || p.criadoEm,
        priority: '0.7',
      }));
  } catch (e) { console.error('Erro ao buscar produtos para sitemap:', e); }

  try {
    const posts = await fetchAllDocs('blog');
    posts
      .filter(p => p.status === 'publicado' && p.slug)
      .forEach(p => urls.push({
        loc: `${SITE_URL}/blog/${p.slug}`,
        lastmod: p.atualizadoEm || p.criadoEm,
        priority: '0.6',
      }));
  } catch (e) { console.error('Erro ao buscar posts para sitemap:', e); }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(urlTag).join('\n')}\n</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
  return res.status(200).send(xml);
}
