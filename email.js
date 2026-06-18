const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendVerificationEmail(toEmail, userName, token) {
  if (!resend) { console.log('[Email disabled] sendVerificationEmail to:', toEmail); return; }
  const verifyUrl = `https://shopflow-client.vercel.app/pages/verify-email.html?token=${token}`;
  await resend.emails.send({
    from: 'onboarding@resend.dev', to: toEmail,
    subject: 'Verify your ShopFlow email address',
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:2rem;"><h1 style="color:#2563eb;">Welcome to ShopFlow, ${userName}!</h1><p>Please verify your email address to activate your account.</p><a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:.85rem 2rem;border-radius:8px;text-decoration:none;font-weight:700;">Verify Email Address</a><p style="color:#94a3b8;font-size:.8rem;margin-top:2rem;">This link expires in 24 hours.</p></div>`
  });
}

async function sendVerificationSuccessEmail(toEmail, userName) {
  if (!resend) { console.log('[Email disabled] sendVerificationSuccessEmail to:', toEmail); return; }
  await resend.emails.send({
    from: 'onboarding@resend.dev', to: toEmail,
    subject: 'Your ShopFlow email has been verified',
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:2rem;"><h1 style="color:#22c55e;">Email Verified!</h1><p>Hi ${userName}, your account is now fully active.</p><a href="https://shopflow-client.vercel.app" style="display:inline-block;background:#2563eb;color:#fff;padding:.85rem 2rem;border-radius:8px;text-decoration:none;font-weight:700;margin-top:1.5rem;">Start Shopping</a></div>`
  });
}

module.exports = { sendVerificationEmail, sendVerificationSuccessEmail };
