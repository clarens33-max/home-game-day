const router = require('express').Router()
const prisma = require('../lib/prisma')

// GET /api/portal/on-the-day/:token — roles and match schedule for volunteers
router.get('/:token', async (req, res) => {
  const game = await prisma.game.findUnique({
    where: { onTheDayToken: req.params.token },
    select: {
      id: true, title: true, eventDate: true, doorsOpen: true,
      venueName: true, homeTeamName: true, logoUrl: true,
      gameDayRoles: {
        include: {
          template: true,
          slots: { orderBy: { slotIndex: 'asc' } },
        },
        orderBy: { order: 'asc' },
      },
      matches: {
        orderBy: { order: 'asc' },
      },
    },
  })
  if (!game) return res.status(404).json({ error: 'Not found' })
  res.json(game)
})

// PATCH /api/portal/on-the-day/:token/day-roles/:roleId/slots/:slotIndex — volunteer claims a role slot
router.patch('/:token/day-roles/:roleId/slots/:slotIndex', async (req, res) => {
  const game = await prisma.game.findUnique({ where: { onTheDayToken: req.params.token } })
  if (!game) return res.status(404).json({ error: 'Not found' })

  const { personName } = req.body
  const slotIndex = parseInt(req.params.slotIndex)

  const role = await prisma.gameDayRole.findFirst({ where: { id: req.params.roleId, gameId: game.id } })
  if (!role) return res.status(404).json({ error: 'Role not found' })

  const slot = await prisma.gameDayRoleSlot.upsert({
    where: { roleId_slotIndex: { roleId: req.params.roleId, slotIndex } },
    update: { personName: personName ?? null },
    create: { roleId: req.params.roleId, slotIndex, personName: personName ?? null },
  })
  res.json(slot)
})

module.exports = router
