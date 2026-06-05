const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(toEmail, userName, token) {
  const verifyUrl = `https://shopflow-client.vercel.app/pages/verify-email.html?token=${token}`;
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Verify your ShopFlow email address',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:2rem;">
        <h1 style="color:#2563eb;font-size:1.5rem;margin-bottom:.5rem;">Welcome to ShopFlow, ${userName}!</h1>
        <p style="color:#374151;line-height:1.6;margin-bottom:1.5rem;">Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:.85rem 2rem;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem;">Verify Email Address</a>
        <p style="color:#94a3b8;font-size:.8rem;margin-top:2rem;">This link expires in 24 hours.</p>
      </div>
    `
  });
}

async function sendVerificationSuccessEmail(toEmail, userName) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Your ShopFlow email has been verified',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:2rem;">
        <h1 style="color:#22c55e;font-size:1.5rem;margin-bottom:.5rem;">Email Verified!</h1>
        <p style="color:#374151;line-height:1.6;">Hi ${userName}, your account is now fully active.</p>
        <a href="http://127.0.0.1:5500/index.html" style="display:inline-block;background:#2563eb;color:#fff;padding:.85rem 2rem;border-radius:8px;text-decoration:none;font-weight:700;margin-top:1.5rem;">Start Shopping</a>
      </div>
    `
  });
}

module.exports = { sendVerificationEmail, sendVerificationSuccessEmail };
