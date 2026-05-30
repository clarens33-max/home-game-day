const router = require('express').Router()
const prisma = require('../lib/prisma')

// GET /api/portal/guest/:token
router.get('/:token', async (req, res) => {
  const game = await prisma.game.findUnique({
    where: { guestToken: req.params.token },
    select: {
      id: true, title: true, eventDate: true, doorsOpen: true,
      venueName: true, venueAddress: true, venueMapUrl: true,
      homeTeamName: true, logoUrl: true,
      publicToken: true, // included so guest portal can link to info pack
      matches: { orderBy: { order: 'asc' } },
      timingBlocks: { orderBy: { order: 'asc' } },
      teams: {
        include: {
          skaters: { orderBy: [{ benchSlot: 'asc' }, { number: 'asc' }] },
        },
      },
    },
  })
  if (!game) return res.status(404).json({ error: 'Not found' })
  res.json(game)
})

// POST /api/portal/guest/:token/teams/:teamId/skaters
router.post('/:token/teams/:teamId/skaters', async (req, res) => {
  const game = await prisma.game.findUnique({ where: { guestToken: req.params.token } })
  if (!game) return res.status(404).json({ error: 'Not found' })
  const { derbyName, skaterNumber, pronouns, benchSlot } = req.body
  if (!derbyName) return res.status(400).json({ error: 'derbyName required' })
  const skater = await prisma.skater.create({
    data: {
      teamId: req.params.teamId,
      derbyName,
      skaterNumber: skaterNumber ?? null,
      pronouns: pronouns ?? null,
      benchSlot: benchSlot ?? false,
    },
  })
  res.status(201).json(skater)
})

// POST /api/portal/guest/:token/skaters/:skaterId/waiver
router.post('/:token/skaters/:skaterId/waiver', async (req, res) => {
  const game = await prisma.game.findUnique({ where: { guestToken: req.params.token } })
  if (!game) return res.status(404).json({ error: 'Not found' })
  const { signatureData } = req.body
  if (!signatureData) return res.status(400).json({ error: 'signatureData required' })
  const skater = await prisma.skater.update({
    where: { id: req.params.skaterId },
    data: { waiverSigned: true, waiverSignedAt: new Date(), waiverSignature: signatureData },
  })
  res.json(skater)
})

module.exports = router
