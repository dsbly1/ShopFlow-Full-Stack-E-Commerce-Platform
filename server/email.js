const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.log('[Email disabled] Would have sent:', { to, subject });
    return;
  }
  return resend.emails.send({ from: 'ShopFlow <no-reply@shopflow.com>', to, subject, html });
}

module.exports = { sendEmail };
