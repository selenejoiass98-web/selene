// Busca pedidos para a página de rastreio SEM expor a coleção `pedidos`
// publicamente (ela contém CPF, endereço e telefone dos clientes).
// Consulta o Firestore via REST com service account (env FIREBASE_SERVICE_ACCOUNT)
// e devolve apenas os campos seguros para exibição.

import crypto from 'crypto';

const PROJECT = 'selene-joias';
let tokenCache = { token: null, exp: 0 };

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache.token && tokenCache.exp > now + 60) return tokenCache.token;

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = header + '.' + claims;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key);
  const jwt = unsigned + '.' + b64url(signature);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + jwt,
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error('Falha ao autenticar no Firestore: ' + JSON.stringify(data));
  tokenCache = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return tokenCache.token;
}

// Converte o formato de valores do Firestore REST para JS puro
function fromFsValue(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('mapValue' in v) {
    const out = {};
    const fields = v.mapValue.fields || {};
    for (const k of Object.keys(fields)) out[k] = fromFsValue(fields[k]);
    return out;
  }
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFsValue);
  return null;
}

async function queryPedidos(token, campo, valor) {
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'pedidos' }],
        where: {
          fieldFilter: {
            field: { fieldPath: campo },
            op: 'EQUAL',
            value: { stringValue: valor },
          },
        },
        limit: 20,
      },
    }),
  });
  const rows = await res.json();
  if (!res.ok) throw new Error('runQuery falhou: ' + JSON.stringify(rows));
  return rows
    .filter(r => r.document)
    .map(r => {
      const doc = fromFsValue({ mapValue: { fields: r.document.fields } }) || {};
      doc._id = r.document.name.split('/').pop();
      return doc;
    });
}

// Só o que a tela de rastreio precisa — nunca CPF, endereço ou telefone
function sanitizar(p) {
  return {
    numeroPedido: p.numeroPedido || null,
    criadoEm: p.criadoEm || null,
    status: p.status || 'novo',
    pagamento: p.pagamento || null,
    mercadoPago: p.mercadoPago ? { status: p.mercadoPago.status || null } : null,
    codigoRastreio: p.codigoRastreio || null,
    transportadora: p.transportadora || null,
    frete: p.frete ? { nome: p.frete.nome || null, desc: p.frete.desc || null } : null,
    total: typeof p.total === 'number' ? p.total : null,
    primeiroNome: p.cliente && p.cliente.nome ? String(p.cliente.nome).split(' ')[0] : null,
    itens: (p.itens || []).map(i => ({
      nome: i.nome || null,
      variante: i.variante || null,
      preco: typeof i.preco === 'number' ? i.preco : null,
      qty: i.qty || 1,
    })),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saRaw) return res.status(503).json({ error: 'FIREBASE_SERVICE_ACCOUNT não configurada' });

  const { tipo, valor } = req.body || {};
  const v = String(valor || '').trim();
  if (!tipo || !v) return res.status(400).json({ error: 'Campos obrigatórios: tipo, valor' });

  try {
    const sa = JSON.parse(saRaw);
    const token = await getAccessToken(sa);
    let pedidos = [];

    if (tipo === 'pedido') {
      const digits = v.replace(/[^0-9]/g, '');
      if (digits) pedidos = await queryPedidos(token, 'numeroPedido', '#EC-' + digits);
    } else if (tipo === 'correios') {
      pedidos = await queryPedidos(token, 'codigoRastreio', v.toUpperCase());
    } else if (tipo === 'busca') {
      if (v.includes('@')) {
        pedidos = await queryPedidos(token, 'cliente.email', v);
        if (!pedidos.length && v !== v.toLowerCase()) {
          pedidos = await queryPedidos(token, 'cliente.email', v.toLowerCase());
        }
      } else {
        const digits = v.replace(/\D/g, '');
        if (digits.length !== 11) return res.status(400).json({ error: 'CPF deve ter 11 dígitos' });
        const mascarado = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        pedidos = await queryPedidos(token, 'cliente.cpf', mascarado);
        if (!pedidos.length) pedidos = await queryPedidos(token, 'cliente.cpf', digits);
      }
    } else {
      return res.status(400).json({ error: 'tipo inválido' });
    }

    pedidos.sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0));
    return res.status(200).json({ pedidos: pedidos.map(sanitizar) });
  } catch (err) {
    console.error('Rastreio error:', err);
    return res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
}
