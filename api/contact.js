// Cadastra/atualiza um contato na lista "Clientes do Site" do Brevo.
// A lista (e a pasta, se preciso) é criada automaticamente na primeira chamada.
// Chamado pelo checkout ao salvar o pedido — nunca bloqueia a venda.

const LIST_NAME = 'Clientes do Site';
let cachedListId = null;

async function brevo(path, options, key) {
  const res = await fetch('https://api.brevo.com/v3' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'api-key': key },
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* respostas 204 não têm corpo */ }
  return { ok: res.ok, status: res.status, data };
}

async function getListId(key) {
  if (cachedListId) return cachedListId;

  const lists = await brevo('/contacts/lists?limit=50&offset=0', { method: 'GET' }, key);
  const found = (lists.data?.lists || []).find(l => l.name === LIST_NAME);
  if (found) { cachedListId = found.id; return cachedListId; }

  let folderId = null;
  const folders = await brevo('/contacts/folders?limit=1&offset=0', { method: 'GET' }, key);
  folderId = folders.data?.folders?.[0]?.id;
  if (!folderId) {
    const newFolder = await brevo('/contacts/folders', { method: 'POST', body: JSON.stringify({ name: 'Site' }) }, key);
    folderId = newFolder.data?.id;
  }
  if (!folderId) return null;

  const created = await brevo('/contacts/lists', { method: 'POST', body: JSON.stringify({ name: LIST_NAME, folderId }) }, key);
  cachedListId = created.data?.id || null;
  return cachedListId;
}

// "(47) 99725-9678" -> "+5547997259678" (formato que o Brevo exige no campo SMS)
function normalizarTelefone(telefone) {
  if (!telefone) return null;
  const digitos = String(telefone).replace(/\D/g, '');
  if (digitos.length === 10 || digitos.length === 11) return '+55' + digitos;
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) return '+' + digitos;
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const BREVO_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_KEY) return res.status(500).json({ error: 'Chave Brevo não configurada' });

  const { email, nome, telefone } = req.body || {};
  if (!email || !String(email).includes('@')) {
    return res.status(400).json({ error: 'Campo obrigatório: email' });
  }

  try {
    const listId = await getListId(BREVO_KEY);
    if (!listId) return res.status(502).json({ error: 'Não foi possível localizar/criar a lista no Brevo' });

    const attributes = {};
    if (nome) attributes.FIRSTNAME = String(nome);
    const sms = normalizarTelefone(telefone);
    if (sms) attributes.SMS = sms;

    const payload = { email: String(email), updateEnabled: true, listIds: [listId], attributes };
    let result = await brevo('/contacts', { method: 'POST', body: JSON.stringify(payload) }, BREVO_KEY);

    // Telefone duplicado/inválido não pode impedir o cadastro do e-mail
    if (!result.ok && attributes.SMS) {
      delete attributes.SMS;
      result = await brevo('/contacts', { method: 'POST', body: JSON.stringify(payload) }, BREVO_KEY);
    }

    if (!result.ok) return res.status(result.status).json(result.data || { error: 'Erro no Brevo' });
    return res.status(200).json({ success: true, listId });
  } catch (err) {
    console.error('Brevo contact error:', err);
    return res.status(500).json({ error: 'Erro ao cadastrar contato', details: err.message });
  }
}
