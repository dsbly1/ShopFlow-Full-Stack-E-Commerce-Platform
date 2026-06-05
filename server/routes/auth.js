const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const db       = require('../db');
const { sendVerificationEmail } = require('../email');

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' });
  try {
    const hash    = await bcrypt.hash(password, 10);
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash, email_verified)
       VALUES ($1,$2,$3,TRUE) RETURNING id, name, email, role, email_verified`,
      [name, email, hash]
    );
    const jwtToken = jwt.sign(rows[0], process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.status(201).json({ user: rows[0], token: jwtToken, message: 'Check your email to verify your account.' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token required' });
  try {
    const { rows } = await db.query(
      `UPDATE users SET email_verified=TRUE, verification_token=NULL, token_expires_at=NULL
       WHERE verification_token=$1 AND token_expires_at > NOW() RETURNING id, name, email`,
      [token]
    );
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired token' });
    const { sendVerificationSuccessEmail } = require('../email');
    sendVerificationSuccessEmail(rows[0].email, rows[0].name).catch(console.error);
    res.json({ message: 'Email verified successfully!', user: rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    if (rows[0].email_verified) return res.json({ message: 'Already verified' });
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.query('UPDATE users SET verification_token=$1, token_expires_at=$2 WHERE email=$3', [token, expires, email]);
    await sendVerificationEmail(email, rows[0].name, token);
    res.json({ message: 'Verification email resent' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const { password_hash, verification_token, token_expires_at, ...user } = rows[0];
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ user, token });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
