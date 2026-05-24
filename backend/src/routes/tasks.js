const router = require('express').Router({ mergeParams: true })
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')

async function checkOwner(gameId, userId) {
  return prisma.gameOwner.findUnique({ where: { gameId_userId: { gameId, userId } } })
}

// PATCH /api/games/:gameId/tasks/:taskId
router.patch('/:taskId', requireAuth, async (req, res) => {
  const { gameId, taskId } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  const { status, assigneeId, assigneeName, deadlineOverride } = req.body
  const task = await prisma.gameTask.update({
    where: { id: taskId },
    data: {
      ...(status && { status }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      ...(assigneeName !== undefined && { assigneeName: assigneeName || null }),
      ...(deadlineOverride !== undefined && { deadlineOverride: deadlineOverride ? new Date(deadlineOverride) : null }),
    },
    include: {
      template: true,
      assignee: { select: { id: true, name: true } },
      comments: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } },
    },
  })
  res.json(task)
})

// POST /api/games/:gameId/tasks — add custom task
router.post('/', requireAuth, async (req, res) => {
  const { gameId } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  const { category, name } = req.body
  if (!category || !name) return res.status(400).json({ error: 'category and name required' })
  const task = await prisma.gameTask.create({
    data: { gameId, category, name, status: 'TO_DO' },
    include: { template: true, assignee: { select: { id: true, name: true } }, comments: true },
  })
  res.status(201).json(task)
})

// DELETE /api/games/:gameId/tasks/:taskId — only custom tasks
router.delete('/:taskId', requireAuth, async (req, res) => {
  const { gameId, taskId } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  const task = await prisma.gameTask.findUnique({ where: { id: taskId } })
  if (task?.templateId) return res.status(400).json({ error: 'Cannot delete seeded tasks' })
  await prisma.gameTask.delete({ where: { id: taskId } })
  res.json({ ok: true })
})

// POST /api/games/:gameId/tasks/:taskId/comments
router.post('/:taskId/comments', requireAuth, async (req, res) => {
  const { gameId, taskId } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  const { body } = req.body
  if (!body?.trim()) return res.status(400).json({ error: 'Comment body required' })
  const comment = await prisma.taskComment.create({
    data: { taskId, authorId: req.user.id, body },
    include: { author: { select: { id: true, name: true } } },
  })
  res.status(201).json(comment)
})

module.exports = router
