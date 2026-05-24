const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const prisma = require('../lib/prisma')

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function mailer() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, name, password } = req.body
  if (!email || !name || !password) return res.status(400).json({ error: 'All fields required' })
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) return res.status(409).json({ error: 'Email already registered' })
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { email: email.toLowerCase(), name, passwordHash } })
  res.json({ token: signToken(user), user: { id: user.id, email: user.email, name: user.name } })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email: email?.toLowerCase() } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
  res.json({ token: signToken(user), user: { id: user.id, email: user.email, name: user.name } })
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  const user = await prisma.user.findUnique({ where: { email: email?.toLowerCase() } })
  // Always return 200 to avoid user enumeration
  if (!user) return res.json({ ok: true })
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hour
  await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExpires: expires } })
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`
  try {
    await mailer().sendMail({
      from: process.env.SMTP_FROM || 'noreply@homegameday.app',
      to: user.email,
      subject: 'Reset your Home Game Day password',
      html: `<p>Hi ${user.name},</p><p>Click the link below to reset your password (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    })
  } catch (err) {
    console.error('Email send failed:', err.message)
  }
  res.json({ ok: true })
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpires: { gt: new Date() } },
  })
  if (!user) return res.status(400).json({ error: 'Token invalid or expired' })
  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpires: null },
  })
  res.json({ ok: true })
})

// GET /api/auth/me
router.get('/me', require('../middleware/auth').requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true, name: true } })
  res.json(user)
})

module.exports = router
