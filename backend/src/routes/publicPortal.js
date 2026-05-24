const router = require('express').Router()
const prisma = require('../lib/prisma')

// GET /api/portal/public/:token
router.get('/:token', async (req, res) => {
  const game = await prisma.game.findUnique({
    where: { publicToken: req.params.token },
    select: {
      title: true, eventDate: true, doorsOpen: true,
      venueName: true, venueAddress: true, venueMapUrl: true,
      homeTeamName: true, logoUrl: true, ticketingUrl: true, description: true,
      matches: { orderBy: { order: 'asc' } },
      publicSections: { where: { visible: true }, orderBy: { order: 'asc' } },
      timingBlocks: { orderBy: { order: 'asc' } },
      teams: { select: { name: true, role: true, logoUrl: true, jerseyColour: true } },
    },
  })
  if (!game) return res.status(404).json({ error: 'Not found' })
  res.json(game)
})

module.exports = router
