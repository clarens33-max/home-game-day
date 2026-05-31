const router = require('express').Router()
const { v4: uuidv4 } = require('uuid')
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')
const { DEFAULT_INFO_SECTIONS } = require('../lib/defaultInfoSections')

function makeSlug(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)
  return `${base}-${uuidv4().slice(0, 6)}`
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getActiveMembership(leagueId, userId) {
  return prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
  })
}

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

// ── GET /api/leagues — list leagues for current user ─────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const memberships = await prisma.leagueMember.findMany({
    where: { userId: req.user.id },
    include: {
      league: {
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { members: { where: { status: 'ACTIVE' } }, games: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Also include leagues the user owns (may not have a LeagueMember row if created pre-join logic)
  const owned = await prisma.league.findMany({
    where: { ownerId: req.user.id },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { members: { where: { status: 'ACTIVE' } }, games: true } },
    },
  })

  // Merge and deduplicate
  const seen = new Set()
  const leagues = []
  for (const l of owned) {
    if (!seen.has(l.id)) { seen.add(l.id); leagues.push({ league: l, role: 'OWNER', status: 'ACTIVE' }) }
  }
  for (const m of memberships) {
    if (!seen.has(m.leagueId)) { seen.add(m.leagueId); leagues.push({ league: m.league, role: m.role, status: m.status }) }
  }

  res.json(leagues)
})

// ── GET /api/leagues/search?q= — find leagues by name ────────────────────────
router.get('/search', requireAuth, async (req, res) => {
  const { q } = req.query
  if (!q || q.trim().length < 2) return res.json([])
  const leagues = await prisma.league.findMany({
    where: { name: { contains: q.trim(), mode: 'insensitive' } },
    select: { id: true, name: true, slug: true, description: true, owner: { select: { id: true, name: true } }, _count: { select: { members: { where: { status: 'ACTIVE' } } } } },
    take: 10,
  })
  res.json(leagues)
})

// ── POST /api/leagues — create a league ──────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { name, description, slackUrl, discordUrl } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' })

  const league = await prisma.league.create({
    data: {
      name: name.trim(),
      slug: makeSlug(name.trim()),
      description: description?.trim() || null,
      slackUrl: slackUrl?.trim() || null,
      discordUrl: discordUrl?.trim() || null,
      ownerId: req.user.id,
    },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { members: { where: { status: 'ACTIVE' } }, games: true } },
    },
  })

  // Auto-add the owner as an ACTIVE OWNER member
  await prisma.leagueMember.create({
    data: { leagueId: league.id, userId: req.user.id, role: 'OWNER', status: 'ACTIVE' },
  })

  // Seed blueprint tasks, roles, and info sections from generic templates
  const [taskTemplates, dayRoleTemplates] = await Promise.all([
    prisma.taskTemplate.findMany({ orderBy: { order: 'asc' } }),
    prisma.dayRoleTemplate.findMany({ orderBy: { order: 'asc' } }),
  ])

  await prisma.$transaction([
    prisma.blueprintTask.createMany({
      data: taskTemplates.map(t => ({
        leagueId: league.id,
        category: t.category,
        name: t.name,
        leadTimeDays: t.leadTimeDays,
        isRequired: t.isRequired,
        eventScope: t.eventScope,
        order: t.order,
      })),
    }),
    prisma.blueprintDayRole.createMany({
      data: dayRoleTemplates.map(r => ({
        leagueId: league.id,
        name: r.name,
        headcount: r.headcount,
        order: r.order,
      })),
    }),
  ])

  // Seed default info pack template sections
  await prisma.blueprintInfoSection.createMany({
    data: DEFAULT_INFO_SECTIONS.map(s => ({
      leagueId: league.id,
      title: s.title,
      content: s.content,
      sectionType: s.sectionType ?? null,
      imageUrl: null,
      order: s.order,
    })),
  })

  // Create the first active season with a derby-season-aware name
  const now = new Date()
  const year = now.getFullYear()
  const seasonName = now.getMonth() >= 8
    ? `${year}-${String(year + 1).slice(2)} Season`
    : `${year - 1}-${String(year).slice(2)} Season`

  await prisma.leagueSeason.create({
    data: { leagueId: league.id, name: seasonName, isActive: true },
  })

  res.status(201).json(league)
})

// ── GET /api/leagues/:id — get a single league (members + games + blueprint) ─
router.get('/:id', requireAuth, async (req, res) => {
  const league = await prisma.league.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
      games: {
        orderBy: { eventDate: 'asc' },
        select: {
          id: true, slug: true, title: true, eventType: true, eventDate: true,
          homeTeamName: true, venueName: true, logoUrl: true,
          owners: { include: { user: { select: { id: true, name: true } } } },
        },
      },
      blueprintTasks: { orderBy: [{ category: 'asc' }, { order: 'asc' }] },
      blueprintRoles: { orderBy: { order: 'asc' } },
      blueprintInfoSections: { orderBy: { order: 'asc' } },
    },
  })
  if (!league) return res.status(404).json({ error: 'Not found' })

  // Must be owner or active member to view
  const isOwner = league.ownerId === req.user.id
  const isMember = league.members.some(m => m.userId === req.user.id && m.status === 'ACTIVE')
  if (!isOwner && !isMember) return res.status(403).json({ error: 'Forbidden' })

  res.json(league)
})

// ── DELETE /api/leagues/:id — delete a league (owner only) ──────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return
  const { deleteGames } = req.body // boolean

  if (deleteGames) {
    // Delete all games in this league first (cascade handles game subtables)
    const games = await prisma.game.findMany({
      where: { leagueId: req.params.id },
      select: { id: true },
    })
    if (games.length > 0) {
      await prisma.game.deleteMany({ where: { leagueId: req.params.id } })
    }
  } else {
    // Unlink games — set leagueId to null so they survive
    await prisma.game.updateMany({
      where: { leagueId: req.params.id },
      data: { leagueId: null },
    })
  }

  await prisma.league.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

// ── PATCH /api/leagues/:id — update league settings (owner only) ─────────────
router.patch('/:id', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return
  const { name, description, slackUrl, discordUrl } = req.body
  const league = await prisma.league.update({
    where: { id: req.params.id },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(slackUrl !== undefined && { slackUrl: slackUrl?.trim() || null }),
      ...(discordUrl !== undefined && { discordUrl: discordUrl?.trim() || null }),
    },
  })
  res.json(league)
})

// ── POST /api/leagues/:id/join — send a join request ─────────────────────────
router.post('/:id/join', requireAuth, async (req, res) => {
  const league = await prisma.league.findUnique({ where: { id: req.params.id } })
  if (!league) return res.status(404).json({ error: 'Not found' })
  if (league.ownerId === req.user.id) return res.status(400).json({ error: 'You own this league' })

  const existing = await getActiveMembership(req.params.id, req.user.id)
  if (existing) {
    if (existing.status === 'ACTIVE') return res.status(400).json({ error: 'Already a member' })
    if (existing.status === 'PENDING') return res.status(400).json({ error: 'Join request already pending' })
  }

  const member = await prisma.leagueMember.upsert({
    where: { leagueId_userId: { leagueId: req.params.id, userId: req.user.id } },
    update: { status: 'PENDING', role: 'MEMBER' },
    create: { leagueId: req.params.id, userId: req.user.id, role: 'MEMBER', status: 'PENDING' },
  })
  res.status(201).json(member)
})

// ── PATCH /api/leagues/:id/members/:userId — approve, reject, promote, demote ─
router.patch('/:id/members/:userId', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return
  const { action } = req.body // "approve" | "reject" | "promote" | "demote"
  if (!['approve', 'reject', 'promote', 'demote'].includes(action)) {
    return res.status(400).json({ error: 'action must be approve, reject, promote, or demote' })
  }

  const membership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: req.params.id, userId: req.params.userId } },
  })
  if (!membership) return res.status(404).json({ error: 'Member not found' })

  if (action === 'approve') {
    const updated = await prisma.leagueMember.update({
      where: { leagueId_userId: { leagueId: req.params.id, userId: req.params.userId } },
      data: { status: 'ACTIVE' },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    return res.json(updated)
  }

  if (action === 'reject') {
    await prisma.leagueMember.delete({
      where: { leagueId_userId: { leagueId: req.params.id, userId: req.params.userId } },
    })
    return res.json({ ok: true })
  }

  if (action === 'promote') {
    if (membership.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Can only promote active members' })
    }
    const updated = await prisma.leagueMember.update({
      where: { leagueId_userId: { leagueId: req.params.id, userId: req.params.userId } },
      data: { role: 'OWNER' },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    return res.json(updated)
  }

  if (action === 'demote') {
    // Prevent removing the last owner
    const ownerCount = await prisma.leagueMember.count({
      where: { leagueId: req.params.id, role: 'OWNER', status: 'ACTIVE' },
    })
    if (ownerCount <= 1) {
      return res.status(400).json({ error: 'Cannot demote the last owner' })
    }
    const updated = await prisma.leagueMember.update({
      where: { leagueId_userId: { leagueId: req.params.id, userId: req.params.userId } },
      data: { role: 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    return res.json(updated)
  }
})

// ── DELETE /api/leagues/:id/members/:userId — remove member (owner) ───────────
router.delete('/:id/members/:userId', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return
  if (req.params.userId === req.user.id) return res.status(400).json({ error: 'Cannot remove yourself as owner' })
  await prisma.leagueMember.deleteMany({
    where: { leagueId: req.params.id, userId: req.params.userId },
  })
  res.json({ ok: true })
})

// ── Blueprint: tasks ─────────────────────────────────────────────────────────

// POST /api/leagues/:id/blueprint/tasks — add a blueprint task
router.post('/:id/blueprint/tasks', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return
  const { category, name, leadTimeDays, isRequired, eventScope, order } = req.body
  if (!category?.trim() || !name?.trim()) return res.status(400).json({ error: 'category and name required' })

  const task = await prisma.blueprintTask.create({
    data: {
      leagueId: req.params.id,
      category: category.trim(),
      name: name.trim(),
      leadTimeDays: leadTimeDays ?? null,
      isRequired: isRequired ?? false,
      eventScope: eventScope ?? 'BOTH',
      order: order ?? 0,
    },
  })
  res.status(201).json(task)
})

// PATCH /api/leagues/:id/blueprint/tasks/:taskId — update a blueprint task
router.patch('/:id/blueprint/tasks/:taskId', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return
  const { category, name, leadTimeDays, isRequired, eventScope, order } = req.body
  const task = await prisma.blueprintTask.update({
    where: { id: req.params.taskId },
    data: {
      ...(category?.trim() && { category: category.trim() }),
      ...(name?.trim() && { name: name.trim() }),
      ...(leadTimeDays !== undefined && { leadTimeDays: leadTimeDays ?? null }),
      ...(isRequired !== undefined && { isRequired }),
      ...(eventScope && { eventScope }),
      ...(order !== undefined && { order }),
    },
  })
  res.json(task)
})

// DELETE /api/leagues/:id/blueprint/tasks/:taskId
router.delete('/:id/blueprint/tasks/:taskId', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return
  await prisma.blueprintTask.delete({ where: { id: req.params.taskId } })
  res.json({ ok: true })
})

// DELETE /api/leagues/:id/blueprint — clear all blueprint tasks, roles, and info sections
router.delete('/:id/blueprint', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return
  await prisma.$transaction([
    prisma.blueprintTask.deleteMany({ where: { leagueId: req.params.id } }),
    prisma.blueprintDayRole.deleteMany({ where: { leagueId: req.params.id } }),
    prisma.blueprintInfoSection.deleteMany({ where: { leagueId: req.params.id } }),
  ])
  res.json({ ok: true })
})

// Blueprint: seed from generic templates (owner initialises the blueprint)
router.post('/:id/blueprint/seed', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return

  // Check if blueprint already has entries
  const existing = await prisma.blueprintTask.count({ where: { leagueId: req.params.id } })
  if (existing > 0) return res.status(400).json({ error: 'Blueprint already seeded — delete tasks first' })

  const [templates, dayRoles] = await Promise.all([
    prisma.taskTemplate.findMany({ orderBy: { order: 'asc' } }),
    prisma.dayRoleTemplate.findMany({ orderBy: { order: 'asc' } }),
  ])

  // Seed info sections only if none exist yet (they may have been auto-created on league creation)
  const existingInfoCount = await prisma.blueprintInfoSection.count({ where: { leagueId: req.params.id } })

  await prisma.$transaction([
    prisma.blueprintTask.createMany({
      data: templates.map(t => ({
        leagueId: req.params.id,
        category: t.category,
        name: t.name,
        leadTimeDays: t.leadTimeDays,
        isRequired: t.isRequired,
        eventScope: t.eventScope,
        order: t.order,
      })),
    }),
    prisma.blueprintDayRole.createMany({
      data: dayRoles.map(r => ({
        leagueId: req.params.id,
        name: r.name,
        headcount: r.headcount,
        order: r.order,
      })),
    }),
    ...(existingInfoCount === 0 ? [
      prisma.blueprintInfoSection.createMany({
        data: DEFAULT_INFO_SECTIONS.map(s => ({
          leagueId: req.params.id,
          title: s.title,
          content: s.content,
          sectionType: s.sectionType ?? null,
          imageUrl: null,
          order: s.order,
        })),
      }),
    ] : []),
  ])

  const blueprint = await prisma.league.findUnique({
    where: { id: req.params.id },
    select: {
      blueprintTasks: { orderBy: [{ category: 'asc' }, { order: 'asc' }] },
      blueprintRoles: { orderBy: { order: 'asc' } },
      blueprintInfoSections: { orderBy: { order: 'asc' } },
    },
  })
  res.json(blueprint)
})

// ── Blueprint: roles ─────────────────────────────────────────────────────────

// POST /api/leagues/:id/blueprint/roles
router.post('/:id/blueprint/roles', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return
  const { name, headcount, order } = req.body
  if (!name?.trim() || !headcount) return res.status(400).json({ error: 'name and headcount required' })
  const role = await prisma.blueprintDayRole.create({
    data: { leagueId: req.params.id, name: name.trim(), headcount, order: order ?? 0 },
  })
  res.status(201).json(role)
})

// PATCH /api/leagues/:id/blueprint/roles/:roleId
router.patch('/:id/blueprint/roles/:roleId', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return
  const { name, headcount, order } = req.body
  const role = await prisma.blueprintDayRole.update({
    where: { id: req.params.roleId },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(headcount && { headcount }),
      ...(order !== undefined && { order }),
    },
  })
  res.json(role)
})

// DELETE /api/leagues/:id/blueprint/roles/:roleId
router.delete('/:id/blueprint/roles/:roleId', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return
  await prisma.blueprintDayRole.delete({ where: { id: req.params.roleId } })
  res.json({ ok: true })
})

// ── Blueprint: info sections ─────────────────────────────────────────────────

// POST /api/leagues/:id/blueprint/info-sections
router.post('/:id/blueprint/info-sections', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return
  const { title, content, imageUrl, order } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' })

  // Get max order for default placement
  const maxOrder = await prisma.blueprintInfoSection.aggregate({
    where: { leagueId: req.params.id },
    _max: { order: true },
  })

  const section = await prisma.blueprintInfoSection.create({
    data: {
      leagueId: req.params.id,
      title: title.trim(),
      content: content ?? '',
      imageUrl: imageUrl ?? null,
      sectionType: null, // user-created sections are always CUSTOM
      order: order ?? (maxOrder._max.order ?? 0) + 1,
    },
  })
  res.status(201).json(section)
})

// PATCH /api/leagues/:id/blueprint/info-sections/:sectionId
router.patch('/:id/blueprint/info-sections/:sectionId', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return
  const { title, content, imageUrl, order } = req.body
  const section = await prisma.blueprintInfoSection.update({
    where: { id: req.params.sectionId },
    data: {
      ...(title?.trim() && { title: title.trim() }),
      ...(content !== undefined && { content }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(order !== undefined && { order }),
    },
  })
  res.json(section)
})

// DELETE /api/leagues/:id/blueprint/info-sections/:sectionId
router.delete('/:id/blueprint/info-sections/:sectionId', requireAuth, async (req, res) => {
  if (!await requireOwner(req.params.id, req.user.id, res)) return
  await prisma.blueprintInfoSection.delete({ where: { id: req.params.sectionId } })
  res.json({ ok: true })
})

module.exports = router
