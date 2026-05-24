const router = require('express').Router({ mergeParams: true })
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')

async function checkOwner(gameId, userId) {
  return prisma.gameOwner.findUnique({ where: { gameId_userId: { gameId, userId } } })
}

// PATCH /api/games/:gameId/day-roles/:roleId/slots/:slotIndex
router.patch('/:roleId/slots/:slotIndex', requireAuth, async (req, res) => {
  const { gameId, roleId, slotIndex } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  const { userId, personName } = req.body
  const slot = await prisma.gameDayRoleSlot.upsert({
    where: { roleId_slotIndex: { roleId, slotIndex: Number(slotIndex) } },
    update: {
      userId: userId || null,
      personName: personName || null,
    },
    create: {
      roleId,
      slotIndex: Number(slotIndex),
      userId: userId || null,
      personName: personName || null,
    },
    include: { user: { select: { id: true, name: true } } },
  })
  res.json(slot)
})

// DELETE /api/games/:gameId/day-roles/:roleId/slots/:slotIndex
router.delete('/:roleId/slots/:slotIndex', requireAuth, async (req, res) => {
  const { gameId, roleId, slotIndex } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  await prisma.gameDayRoleSlot.deleteMany({ where: { roleId, slotIndex: Number(slotIndex) } })
  res.json({ ok: true })
})

// POST /api/games/:gameId/day-roles — add custom role
router.post('/', requireAuth, async (req, res) => {
  const { gameId } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  const { name, headcount } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  const count = await prisma.gameDayRole.count({ where: { gameId } })
  const role = await prisma.gameDayRole.create({
    data: { gameId, name, headcount: headcount ?? 'x1', order: count + 1 },
    include: { slots: true },
  })
  res.status(201).json(role)
})

module.exports = router
