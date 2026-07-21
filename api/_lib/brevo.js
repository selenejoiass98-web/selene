// Envio de e-mail transacional via Brevo — mesmo provedor usado em api/email.js,
// mas chamado direto (sem round-trip HTTP) de dentro de outras functions
// (webhook do Mercado Pago, cron de boletos vencidos).

export async function sendEmail({ to, toName, subject, htmlContent, bcc }) {
  const BREVO_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_KEY) throw new Error('Chave Brevo não configurada');

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': BREVO_KEY,
    },
    body: JSON.stringify({
      sender: { name: 'Elenice Collection', email: 'contato@elenicecollection.com.br' },
      to: [{ email: to, name: toName || to }],
      bcc: bcc === false ? undefined : [{ email: 'contato@elenicecollection.com.br', name: 'Elenice Collection' }],
      subject,
      htmlContent,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Brevo: ' + JSON.stringify(data));
  return data;
}

// Wrapper visual padrão dos e-mails da loja (mesmo estilo usado no checkout
// e nos e-mails de status do admin).
export function emailWrapper(titulo, corpoHtml) {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0EA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EA;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FEFCF9;border:1px solid #E0CEBB;max-width:560px;width:100%;">
        <tr>
          <td style="background:#3D2B1A;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:300;letter-spacing:8px;color:#C4A47A;text-transform:uppercase;">Elenice Collection</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:300;color:#3D2B1A;margin:0 0 16px;">${titulo}</h1>
            ${corpoHtml}
          </td>
        </tr>
        <tr>
          <td style="background:#F5F0EA;padding:24px 40px;text-align:center;border-top:1px solid #E0CEBB;">
            <p style="margin:0;font-size:11px;color:#9C8070;letter-spacing:1px;">Com carinho, equipe Elenice Collection ✦</p>
            <p style="margin:4px 0 0;font-size:11px;color:#C4A47A;letter-spacing:1px;">elenicecollection.com.br</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
