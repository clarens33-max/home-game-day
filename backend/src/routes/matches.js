const router = require('express').Router({ mergeParams: true })
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')

async function checkOwner(gameId, userId) {
  return prisma.gameOwner.findUnique({ where: { gameId_userId: { gameId, userId } } })
}

// GET /api/games/:gameId/matches
router.get('/', requireAuth, async (req, res) => {
  if (!await checkOwner(req.params.gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  const matches = await prisma.match.findMany({ where: { gameId: req.params.gameId }, orderBy: { order: 'asc' } })
  res.json(matches)
})

// POST /api/games/:gameId/matches
router.post('/', requireAuth, async (req, res) => {
  const { gameId } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  const { homeTeam, awayTeam, scheduledTime, durationMinutes, periods, boutType, notes, order } = req.body
  if (!homeTeam || !awayTeam) return res.status(400).json({ error: 'homeTeam and awayTeam required' })
  // Auto-order if not provided
  const count = await prisma.match.count({ where: { gameId } })
  const match = await prisma.match.create({
    data: {
      gameId,
      homeTeam,
      awayTeam,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
      durationMinutes: durationMinutes ?? 30,
      periods: periods ?? 2,
      boutType: boutType ?? null,
      notes: notes ?? null,
      order: order ?? count + 1,
    },
  })
  res.status(201).json(match)
})

// POST /api/games/:gameId/matches/generate-roundrobin — auto-generate round-robin schedule
router.post('/generate-roundrobin', requireAuth, async (req, res) => {
  const { gameId } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  const { teams, durationMinutes, periods, boutType } = req.body
  // teams: array of team names e.g. ["Bath B", "London D", "Cambridge B", "Rough Diamonds"]
  if (!teams || teams.length < 2) return res.status(400).json({ error: 'At least 2 teams required' })

  const matchups = []
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matchups.push({ homeTeam: teams[i], awayTeam: teams[j] })
    }
  }

  // Delete existing matches first
  await prisma.match.deleteMany({ where: { gameId } })

  const matches = await prisma.$transaction(
    matchups.map((m, idx) =>
      prisma.match.create({
        data: {
          gameId,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          durationMinutes: durationMinutes ?? 30,
          periods: periods ?? 1,
          boutType: boutType ?? null,
          order: idx + 1,
        },
      })
    )
  )
  res.json(matches)
})

// PATCH /api/games/:gameId/matches/:matchId
router.patch('/:matchId', requireAuth, async (req, res) => {
  const { gameId, matchId } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  const { homeTeam, awayTeam, scheduledTime, durationMinutes, periods, boutType, notes, order } = req.body
  const match = await prisma.match.update({
    where: { id: matchId },
    data: {
      ...(homeTeam && { homeTeam }),
      ...(awayTeam && { awayTeam }),
      ...(scheduledTime !== undefined && { scheduledTime: scheduledTime ? new Date(scheduledTime) : null }),
      ...(durationMinutes !== undefined && { durationMinutes }),
      ...(periods !== undefined && { periods }),
      ...(boutType !== undefined && { boutType }),
      ...(notes !== undefined && { notes }),
      ...(order !== undefined && { order }),
    },
  })
  res.json(match)
})

// DELETE /api/games/:gameId/matches/:matchId
router.delete('/:matchId', requireAuth, async (req, res) => {
  const { gameId, matchId } = req.params
  if (!await checkOwner(gameId, req.user.id)) return res.status(403).json({ error: 'Forbidden' })
  await prisma.match.delete({ where: { id: matchId } })
  res.json({ ok: true })
})

module.exports = router
