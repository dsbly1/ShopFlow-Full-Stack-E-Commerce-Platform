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


const authMiddleware = require('../middleware/auth');

// POST /api/auth/become-seller — upgrade user to seller
router.post('/become-seller', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE users SET role='seller' WHERE id=$1 RETURNING id, name, email, role`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(rows[0], process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ user: rows[0], token, message: 'You are now a seller!' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});


const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/uploads/avatars');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Images only'));
    cb(null, true);
  }
});

router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await db.query('UPDATE users SET avatar_url=$1 WHERE id=$2', [avatarUrl, req.user.id]);
    res.json({ avatar_url: avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id=$1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
