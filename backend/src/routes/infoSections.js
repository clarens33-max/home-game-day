const router = require('express').Router({ mergeParams: true })
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')

async function requireGameOwner(gameId, userId, res) {
  const owner = await prisma.gameOwner.findUnique({
    where: { gameId_userId: { gameId, userId } },
  })
  if (!owner) { res.status(403).json({ error: 'Forbidden' }); return false }
  return true
}

// GET /api/games/:gameId/info-sections
router.get('/', requireAuth, async (req, res) => {
  if (!await requireGameOwner(req.params.gameId, req.user.id, res)) return
  const sections = await prisma.publicSection.findMany({
    where: { gameId: req.params.gameId },
    orderBy: { order: 'asc' },
  })
  res.json(sections)
})

// POST /api/games/:gameId/info-sections
router.post('/', requireAuth, async (req, res) => {
  if (!await requireGameOwner(req.params.gameId, req.user.id, res)) return
  const { title, content, imageUrl, order, visible } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' })

  // Get max order for default placement
  const maxOrder = await prisma.publicSection.aggregate({
    where: { gameId: req.params.gameId },
    _max: { order: true },
  })

  const section = await prisma.publicSection.create({
    data: {
      gameId: req.params.gameId,
      type: 'custom',
      sectionType: 'CUSTOM',
      title: title.trim(),
      content: content ?? '',
      imageUrl: imageUrl ?? null,
      order: order ?? (maxOrder._max.order ?? 0) + 1,
      visible: visible ?? true,
    },
  })
  res.status(201).json(section)
})

// PATCH /api/games/:gameId/info-sections/:sectionId
router.patch('/:sectionId', requireAuth, async (req, res) => {
  if (!await requireGameOwner(req.params.gameId, req.user.id, res)) return
  const { title, content, imageUrl, order, visible } = req.body
  const section = await prisma.publicSection.update({
    where: { id: req.params.sectionId },
    data: {
      ...(title?.trim() && { title: title.trim() }),
      ...(content !== undefined && { content }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(order !== undefined && { order }),
      ...(visible !== undefined && { visible }),
    },
  })
  res.json(section)
})

// DELETE /api/games/:gameId/info-sections/:sectionId
router.delete('/:sectionId', requireAuth, async (req, res) => {
  if (!await requireGameOwner(req.params.gameId, req.user.id, res)) return
  const section = await prisma.publicSection.findUnique({ where: { id: req.params.sectionId } })
  if (!section) return res.status(404).json({ error: 'Section not found' })
  if (section.sectionType === 'AUTO_TEAMS' || section.sectionType === 'AUTO_SCHEDULE') {
    return res.status(400).json({ error: 'Auto-populated sections cannot be deleted' })
  }
  await prisma.publicSection.delete({ where: { id: req.params.sectionId } })
  res.json({ ok: true })
})

module.exports = router
