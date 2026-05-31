const router = require('express').Router({ mergeParams: true })
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireOwner(leagueId, userId, res) {
  const league = await prisma.league.findUnique({ where: { id: leagueId } })
  if (!league) { res.status(404).json({ error: 'League not found' }); return null }

  const isOriginalOwner = league.ownerId === userId
  if (!isOriginalOwner) {
    const membership = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    })
    if (!membership || membership.role !== 'OWNER' || membership.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Forbidden' }); return null
    }
  }
  return league
}

async function requireMember(leagueId, userId, res) {
  const league = await prisma.league.findUnique({ where: { id: leagueId } })
  if (!league) { res.status(404).json({ error: 'League not found' }); return null }

  if (league.ownerId === userId) return league

  const membership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
  })
  if (!membership || membership.status !== 'ACTIVE') {
    res.status(403).json({ error: 'Forbidden' }); return null
  }
  return league
}

// ── GET /api/leagues/:leagueId/seasons ───────────────────────────────────────

router.get('/', requireAuth, async (req, res) => {
  if (!await requireMember(req.params.leagueId, req.user.id, res)) return

  const seasons = await prisma.leagueSeason.findMany({
    where: { leagueId: req.params.leagueId },
    include: {
      _count: { select: { teams: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  res.json(seasons)
})

// ── POST /api/leagues/:leagueId/seasons ──────────────────────────────────────

router.post('/', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.leagueId, req.user.id, res)) return

  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' })

  const leagueId = req.params.leagueId

  const [, season] = await prisma.$transaction([
    prisma.leagueSeason.updateMany({
      where: { leagueId },
      data: { isActive: false },
    }),
    prisma.leagueSeason.create({
      data: { leagueId, name: name.trim(), isActive: true },
    }),
  ])

  res.status(201).json(season)
})

// ── GET /api/leagues/:leagueId/seasons/:seasonId — full season with teams + skaters

router.get('/:seasonId', requireAuth, async (req, res) => {
  if (!await requireMember(req.params.leagueId, req.user.id, res)) return

  const season = await prisma.leagueSeason.findUnique({
    where: { id: req.params.seasonId },
    include: {
      teams: {
        include: { skaters: { orderBy: { createdAt: 'asc' } } },
        orderBy: { order: 'asc' },
      },
    },
  })
  if (!season || season.leagueId !== req.params.leagueId) {
    return res.status(404).json({ error: 'Season not found' })
  }
  res.json(season)
})

// ── PATCH /api/leagues/:leagueId/seasons/:seasonId ───────────────────────────

router.patch('/:seasonId', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.leagueId, req.user.id, res)) return

  const { name, isActive } = req.body
  const leagueId = req.params.leagueId
  const seasonId = req.params.seasonId

  // Verify season belongs to this league
  const existing = await prisma.leagueSeason.findUnique({ where: { id: seasonId } })
  if (!existing || existing.leagueId !== leagueId) {
    return res.status(404).json({ error: 'Season not found' })
  }

  let season
  if (isActive === true) {
    // Deactivate all others first, then activate this one
    await prisma.leagueSeason.updateMany({
      where: { leagueId, id: { not: seasonId } },
      data: { isActive: false },
    })
    season = await prisma.leagueSeason.update({
      where: { id: seasonId },
      data: {
        isActive: true,
        ...(name?.trim() && { name: name.trim() }),
      },
    })
  } else {
    season = await prisma.leagueSeason.update({
      where: { id: seasonId },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        ...(isActive !== undefined && { isActive }),
      },
    })
  }

  res.json(season)
})

// ── DELETE /api/leagues/:leagueId/seasons/:seasonId ──────────────────────────

router.delete('/:seasonId', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.leagueId, req.user.id, res)) return

  const existing = await prisma.leagueSeason.findUnique({ where: { id: req.params.seasonId } })
  if (!existing || existing.leagueId !== req.params.leagueId) {
    return res.status(404).json({ error: 'Season not found' })
  }

  await prisma.leagueSeason.delete({ where: { id: req.params.seasonId } })
  res.json({ ok: true })
})

// ── POST /api/leagues/:leagueId/seasons/:seasonId/teams ──────────────────────

router.post('/:seasonId/teams', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.leagueId, req.user.id, res)) return

  const { name, jerseyColour, logoUrl, order } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' })

  const season = await prisma.leagueSeason.findUnique({ where: { id: req.params.seasonId } })
  if (!season || season.leagueId !== req.params.leagueId) {
    return res.status(404).json({ error: 'Season not found' })
  }

  const team = await prisma.leagueTeam.create({
    data: {
      seasonId: req.params.seasonId,
      name: name.trim(),
      jerseyColour: jerseyColour?.trim() || null,
      logoUrl: logoUrl?.trim() || null,
      order: order ?? 0,
    },
  })
  res.status(201).json(team)
})

// ── PATCH /api/leagues/:leagueId/seasons/:seasonId/teams/:teamId ─────────────

router.patch('/:seasonId/teams/:teamId', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.leagueId, req.user.id, res)) return

  const { name, jerseyColour, logoUrl, order } = req.body
  const team = await prisma.leagueTeam.update({
    where: { id: req.params.teamId },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(jerseyColour !== undefined && { jerseyColour: jerseyColour?.trim() || null }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl?.trim() || null }),
      ...(order !== undefined && { order }),
    },
  })
  res.json(team)
})

// ── DELETE /api/leagues/:leagueId/seasons/:seasonId/teams/:teamId ────────────

router.delete('/:seasonId/teams/:teamId', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.leagueId, req.user.id, res)) return

  await prisma.leagueTeam.delete({ where: { id: req.params.teamId } })
  res.json({ ok: true })
})

// ── POST /api/leagues/:leagueId/seasons/:seasonId/teams/:teamId/skaters ──────

router.post('/:seasonId/teams/:teamId/skaters', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.leagueId, req.user.id, res)) return

  const { derbyName, skaterNumber, pronouns } = req.body
  if (!derbyName?.trim()) return res.status(400).json({ error: 'derbyName is required' })

  const skater = await prisma.leagueSkater.create({
    data: {
      teamId: req.params.teamId,
      derbyName: derbyName.trim(),
      skaterNumber: skaterNumber?.trim() || null,
      pronouns: pronouns?.trim() || null,
    },
  })
  res.status(201).json(skater)
})

// ── POST /api/leagues/:leagueId/seasons/:seasonId/teams/:teamId/skaters/bulk ─

router.post('/:seasonId/teams/:teamId/skaters/bulk', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.leagueId, req.user.id, res)) return

  const { skaters } = req.body
  if (!Array.isArray(skaters) || skaters.length === 0) {
    return res.status(400).json({ error: 'skaters array is required' })
  }

  const valid = skaters.filter(s => s.derbyName?.trim())
  if (valid.length === 0) return res.status(400).json({ error: 'No valid skaters (derbyName required)' })

  await prisma.leagueSkater.createMany({
    data: valid.map(s => ({
      teamId: req.params.teamId,
      derbyName: s.derbyName.trim(),
      skaterNumber: s.skaterNumber?.trim() || null,
      pronouns: s.pronouns?.trim() || null,
    })),
  })

  res.status(201).json({ created: valid.length })
})

// ── PATCH /api/leagues/:leagueId/seasons/:seasonId/teams/:teamId/skaters/:skaterId

router.patch('/:seasonId/teams/:teamId/skaters/:skaterId', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.leagueId, req.user.id, res)) return

  const { derbyName, skaterNumber, pronouns } = req.body
  const skater = await prisma.leagueSkater.update({
    where: { id: req.params.skaterId },
    data: {
      ...(derbyName?.trim() && { derbyName: derbyName.trim() }),
      ...(skaterNumber !== undefined && { skaterNumber: skaterNumber?.trim() || null }),
      ...(pronouns !== undefined && { pronouns: pronouns?.trim() || null }),
    },
  })
  res.json(skater)
})

// ── DELETE /api/leagues/:leagueId/seasons/:seasonId/teams/:teamId/skaters/:skaterId

router.delete('/:seasonId/teams/:teamId/skaters/:skaterId', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.leagueId, req.user.id, res)) return

  await prisma.leagueSkater.delete({ where: { id: req.params.skaterId } })
  res.json({ ok: true })
})

module.exports = router
