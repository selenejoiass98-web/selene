// Acesso ao Firestore via REST + service account, sem depender do SDK
// (o projeto não tem package.json/node_modules — só built-ins do Node).

import { getGoogleAccessToken } from './google-auth.js';

const PROJECT = 'selene-joias';

export async function getFirestoreAccessToken() {
  return getGoogleAccessToken('https://www.googleapis.com/auth/datastore');
}

// Converte o formato de valores do Firestore REST para JS puro
export function fsValueToJs(v) {
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
    for (const k of Object.keys(fields)) out[k] = fsValueToJs(fields[k]);
    return out;
  }
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fsValueToJs);
  return null;
}

// Converte JS puro para o formato de valores do Firestore REST
export function jsToFsValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(jsToFsValue) } };
  if (typeof v === 'object') {
    const fields = {};
    for (const k of Object.keys(v)) fields[k] = jsToFsValue(v[k]);
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

// Busca documentos de uma coleção filtrando por igualdade num campo
// (suporta campo aninhado via dot-path, ex: "mercadoPago.id")
export async function fsRunQuery(token, collectionId, fieldPath, value, limit = 20) {
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: { fieldFilter: { field: { fieldPath }, op: 'EQUAL', value: jsToFsValue(value) } },
        limit,
      },
    }),
  });
  const rows = await res.json();
  if (!res.ok) throw new Error('runQuery falhou: ' + JSON.stringify(rows));
  return rows
    .filter(r => r.document)
    .map(r => {
      const doc = fsValueToJs({ mapValue: { fields: r.document.fields } }) || {};
      doc._id = r.document.name.split('/').pop();
      return doc;
    });
}

function buildNestedFields(dotKeyedObj) {
  const root = {};
  for (const [dotKey, value] of Object.entries(dotKeyedObj)) {
    const parts = dotKey.split('.');
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }
  return root;
}

// Atualiza só os campos informados (suporta dot-path pra campos aninhados,
// ex: {"mercadoPago.status": "approved"}), sem sobrescrever o resto do doc.
export async function fsPatch(token, collectionId, docId, dotKeyedUpdates) {
  const fieldPaths = Object.keys(dotKeyedUpdates);
  if (!fieldPaths.length) return null;
  const nested = buildNestedFields(dotKeyedUpdates);
  const fsFields = jsToFsValue(nested).mapValue.fields;
  const mask = fieldPaths.map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${collectionId}/${docId}?${mask}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ fields: fsFields }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error('patch falhou: ' + JSON.stringify(data));
  return data;
}
