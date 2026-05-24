const router = require('express').Router({ mergeParams: true })
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')

async function checkOwner(gameId, userId) {
  return prisma.gameOwner.findUnique({ where: { gameId_userId: { gameId, userId } } })
}

// POST /api/games/:gameId/teams — add visiting team
router.post('/', requireAuth, async (req, res) => {
  const { gameId } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  const { name, contactName, contactEmail, jerseyColour } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  const team = await prisma.team.create({
    data: { gameId, name, role: 'VISITING', contactName, contactEmail, jerseyColour },
    include: { skaters: true },
  })
  res.status(201).json(team)
})

// PATCH /api/games/:gameId/teams/:teamId
router.patch('/:teamId', requireAuth, async (req, res) => {
  const { gameId, teamId } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  const { name, contactName, contactEmail, jerseyColour, logoUrl } = req.body
  const team = await prisma.team.update({
    where: { id: teamId },
    data: {
      ...(name && { name }),
      ...(contactName !== undefined && { contactName }),
      ...(contactEmail !== undefined && { contactEmail }),
      ...(jerseyColour !== undefined && { jerseyColour }),
      ...(logoUrl !== undefined && { logoUrl }),
    },
    include: { skaters: true },
  })
  res.json(team)
})

// POST /api/games/:gameId/teams/:teamId/skaters — add skater (owner side)
router.post('/:teamId/skaters', requireAuth, async (req, res) => {
  const { gameId, teamId } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  const { derbyName, skaterNumber, pronouns, number, benchSlot } = req.body
  if (!derbyName) return res.status(400).json({ error: 'derbyName required' })
  const skater = await prisma.skater.create({
    data: { teamId, derbyName, skaterNumber, pronouns, number: number ?? null, benchSlot: benchSlot ?? false },
  })
  res.status(201).json(skater)
})

// PATCH /api/games/:gameId/teams/:teamId/skaters/:skaterId
router.patch('/:teamId/skaters/:skaterId', requireAuth, async (req, res) => {
  const { gameId, skaterId } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  const { derbyName, skaterNumber, pronouns, number, benchSlot, waiverSigned } = req.body
  const skater = await prisma.skater.update({
    where: { id: skaterId },
    data: {
      ...(derbyName && { derbyName }),
      ...(skaterNumber !== undefined && { skaterNumber }),
      ...(pronouns !== undefined && { pronouns }),
      ...(number !== undefined && { number }),
      ...(benchSlot !== undefined && { benchSlot }),
      ...(waiverSigned !== undefined && { waiverSigned }),
    },
  })
  res.json(skater)
})

// DELETE /api/games/:gameId/teams/:teamId/skaters/:skaterId
router.delete('/:teamId/skaters/:skaterId', requireAuth, async (req, res) => {
  const { gameId, skaterId } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  await prisma.skater.delete({ where: { id: skaterId } })
  res.json({ ok: true })
})

// ── Guest portal routes (no auth) ────────────────────────────────────

// POST /api/guest/:guestToken/teams/:teamId/skaters — guest adds their own skater
router.post('/guest/:guestToken/skaters', async (req, res) => {
  const { guestToken, teamId } = req.params
  const game = await prisma.game.findUnique({ where: { guestToken } })
  if (!game) return res.status(404).json({ error: 'Not found' })
  const { derbyName, skaterNumber, pronouns, benchSlot } = req.body
  if (!derbyName) return res.status(400).json({ error: 'derbyName required' })
  const skater = await prisma.skater.create({
    data: { teamId, derbyName, skaterNumber, pronouns, benchSlot: benchSlot ?? false },
  })
  res.status(201).json(skater)
})

// POST /api/guest/:guestToken/skaters/:skaterId/waiver — sign waiver
router.post('/guest/:guestToken/skaters/:skaterId/waiver', async (req, res) => {
  const { guestToken, skaterId } = req.params
  const game = await prisma.game.findUnique({ where: { guestToken } })
  if (!game) return res.status(404).json({ error: 'Not found' })
  const { signatureData } = req.body // base64 PNG from signature_pad
  if (!signatureData) return res.status(400).json({ error: 'signatureData required' })
  const skater = await prisma.skater.update({
    where: { id: skaterId },
    data: { waiverSigned: true, waiverSignedAt: new Date(), waiverSignature: signatureData },
  })
  res.json(skater)
})

module.exports = router
