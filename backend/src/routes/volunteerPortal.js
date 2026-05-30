const router = require('express').Router()
const prisma = require('../lib/prisma')

// GET /api/portal/volunteer/:token — pre-bout checklist for volunteers
router.get('/:token', async (req, res) => {
  const game = await prisma.game.findUnique({
    where: { volunteerToken: req.params.token },
    select: {
      id: true, title: true, eventDate: true, doorsOpen: true,
      venueName: true, homeTeamName: true, logoUrl: true,
      gameTasks: {
        include: { template: true },
        orderBy: { order: 'asc' },
      },
    },
  })
  if (!game) return res.status(404).json({ error: 'Not found' })
  res.json(game)
})

// PATCH /api/portal/volunteer/:token/tasks/:taskId — volunteer claims or updates a task
router.patch('/:token/tasks/:taskId', async (req, res) => {
  const game = await prisma.game.findUnique({ where: { volunteerToken: req.params.token } })
  if (!game) return res.status(404).json({ error: 'Not found' })

  const { status, assigneeName } = req.body
  const validStatuses = ['TO_DO', 'IN_PROGRESS', 'DONE']
  if (status && !validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' })

  const task = await prisma.gameTask.findFirst({ where: { id: req.params.taskId, gameId: game.id } })
  if (!task) return res.status(404).json({ error: 'Task not found' })

  const updated = await prisma.gameTask.update({
    where: { id: req.params.taskId },
    data: {
      ...(status && { status }),
      ...(assigneeName !== undefined && { assigneeName }),
    },
    include: { template: true },
  })
  res.json(updated)
})

module.exports = router
