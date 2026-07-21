// Autenticação genérica com contas de serviço do Google (JWT Bearer Grant),
// reutilizável para qualquer API do Google (Firestore, Search Console, etc)
// que aceite o mesmo service account. Usa só built-ins do Node — o projeto
// não tem package.json/node_modules.

import crypto from 'crypto';

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const tokenCacheByScope = {};

export async function getGoogleAccessToken(scope) {
  const now = Math.floor(Date.now() / 1000);
  const cached = tokenCacheByScope[scope];
  if (cached && cached.exp > now + 60) return cached.token;

  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saRaw) throw new Error('FIREBASE_SERVICE_ACCOUNT não configurada');
  const sa = JSON.parse(saRaw);

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope,
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
  if (!res.ok || !data.access_token) throw new Error('Falha ao autenticar no Google: ' + JSON.stringify(data));
  tokenCacheByScope[scope] = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return data.access_token;
}
