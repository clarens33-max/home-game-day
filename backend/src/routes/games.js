const router = require('express').Router()
const { v4: uuidv4 } = require('uuid')
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')
const { DEFAULT_INFO_SECTIONS } = require('../lib/defaultInfoSections')

function makeSlug(title) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)
  return `${base}-${uuidv4().slice(0, 6)}`
}

// GET /api/games — list all games for current user
router.get('/', requireAuth, async (req, res) => {
  const games = await prisma.game.findMany({
    where: { owners: { some: { userId: req.user.id } } },
    orderBy: { eventDate: 'asc' },
    select: {
      id: true, slug: true, title: true, eventType: true, eventDate: true,
      homeTeamName: true, venueName: true, logoUrl: true,
      leagueId: true, league: { select: { id: true, name: true } },
      _count: { select: { gameTasks: true } },
    },
  })
  res.json(games)
})

// POST /api/games — create new game
router.post('/', requireAuth, async (req, res) => {
  const { title, eventType, eventDate, homeTeamName, venueName, venueAddress, venueMapUrl, doorsOpen, ticketingUrl, description, leagueId } = req.body
  if (!title || !eventType || !eventDate) {
    return res.status(400).json({ error: 'title, eventType, and eventDate are required' })
  }

  // Validate league membership if leagueId provided
  if (leagueId) {
    const membership = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: req.user.id } },
    })
    const isOwner = await prisma.league.findFirst({ where: { id: leagueId, ownerId: req.user.id } })
    if (!membership?.status === 'ACTIVE' && !isOwner) {
      return res.status(403).json({ error: 'Not an active member of this league' })
    }
  }

  // Load tasks: from league blueprint if available, else generic templates
  let taskSeedData
  let roleSeedData
  let infoSectionSeedData = []
  if (leagueId) {
    const [blueprintTasks, blueprintRoles, blueprintInfoSections] = await Promise.all([
      prisma.blueprintTask.findMany({
        where: { leagueId, eventScope: { in: [eventType, 'BOTH'] } },
        orderBy: { order: 'asc' },
      }),
      prisma.blueprintDayRole.findMany({
        where: { leagueId },
        orderBy: { order: 'asc' },
      }),
      prisma.blueprintInfoSection.findMany({
        where: { leagueId },
        orderBy: { order: 'asc' },
      }),
    ])

    if (blueprintTasks.length > 0) {
      // Use league blueprint
      taskSeedData = blueprintTasks.map(t => ({
        category: t.category,
        name: t.name,
        status: 'TO_DO',
        order: t.order,
      }))
      roleSeedData = blueprintRoles.map(r => ({
        name: r.name,
        headcount: r.headcount,
        order: r.order,
      }))
    }

    infoSectionSeedData = blueprintInfoSections.map(s => ({
      type: s.sectionType === 'AUTO_TEAMS' ? 'teams' : s.sectionType === 'AUTO_SCHEDULE' ? 'schedule' : 'custom',
      title: s.title,
      content: s.content,
      imageUrl: s.imageUrl,
      sectionType: s.sectionType ?? null,
      order: s.order,
      visible: true,
    }))
  }

  // Fall back to generic templates if no blueprint was found
  if (!taskSeedData) {
    const templates = await prisma.taskTemplate.findMany({
      where: { eventScope: { in: [eventType, 'BOTH'] } },
      orderBy: { order: 'asc' },
    })
    taskSeedData = templates.map(t => ({ templateId: t.id, status: 'TO_DO', order: t.order }))
  }
  if (!roleSeedData) {
    const dayRoles = await prisma.dayRoleTemplate.findMany({ orderBy: { order: 'asc' } })
    roleSeedData = dayRoles.map(r => ({ templateId: r.id, order: r.order }))
  }

  // Fall back to default info sections if no blueprint provided them
  if (infoSectionSeedData.length === 0) {
    infoSectionSeedData = DEFAULT_INFO_SECTIONS.map(s => ({
      type: s.sectionType === 'AUTO_TEAMS' ? 'teams' : s.sectionType === 'AUTO_SCHEDULE' ? 'schedule' : 'custom',
      title: s.title,
      content: s.content,
      imageUrl: null,
      sectionType: s.sectionType ?? null,
      order: s.order,
      visible: true,
    }))
  }

  // Keep backward-compat variable names for the create block
  const templates = taskSeedData
  const dayRoles = roleSeedData

  const game = await prisma.game.create({
    data: {
      slug: makeSlug(title),
      title,
      eventType,
      eventDate: new Date(eventDate),
      doorsOpen: doorsOpen ? new Date(doorsOpen) : null,
      homeTeamName: homeTeamName || title, // fall back to game title if not provided
      venueName,
      venueAddress,
      venueMapUrl,
      ticketingUrl,
      description,
      ...(leagueId && { leagueId }),
      owners: { create: { userId: req.user.id } },
      // Seed tasks (from league blueprint or generic templates)
      gameTasks: { create: templates },
      // Seed day roles (from league blueprint or generic templates)
      gameDayRoles: { create: dayRoles },
      // Seed signs checklist
      signs: {
        create: [
          { name: 'Penalty box signs', copies: '2 sets (2×B, 1×J)', notes: 'Check with Abi — may already be laminated', order: 1 },
          { name: 'Team kit area', copies: 'x2', order: 2 },
          { name: 'Bathroom — let skaters go first', copies: 'x4', order: 3 },
          { name: 'Danger zone area', copies: 'x4', order: 4 },
          { name: 'Cost sign for door', copies: 'x1', order: 5 },
          { name: 'Digital programme QR code', copies: 'x2', order: 6 },
          { name: 'Audience Choice Award', copies: 'x2', order: 7 },
          { name: 'Timing lists', copies: 'x6', notes: '1 for refs/NSO, 1 per team, 1 on the door', order: 8 },
        ],
      },
      // Seed home team charter
      teams: {
        create: {
          name: homeTeamName || title,
          role: 'HOME',
        },
      },
      // Seed info pack sections (from league blueprint or defaults)
      publicSections: { create: infoSectionSeedData },
    },
    include: { owners: true },
  })

  res.status(201).json(game)
})

// GET /api/games/:id — full game detail (owner access)
router.get('/:id', requireAuth, async (req, res) => {
  const game = await prisma.game.findFirst({
    where: { id: req.params.id, owners: { some: { userId: req.user.id } } },
    include: {
      owners: { include: { user: { select: { id: true, name: true, email: true } } } },
      matches: { orderBy: { order: 'asc' } },
      teams: { include: { skaters: { orderBy: [{ benchSlot: 'asc' }, { number: 'asc' }] } } },
      gameTasks: {
        include: {
          template: true,
          assignee: { select: { id: true, name: true } },
          comments: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } },
        },
        orderBy: { order: 'asc' },
      },
      gameDayRoles: {
        include: {
          template: true,
          slots: { include: { user: { select: { id: true, name: true } } }, orderBy: { slotIndex: 'asc' } },
        },
        orderBy: { order: 'asc' },
      },
      teamMembers: { include: { user: { select: { id: true, name: true, email: true } } } },
      signs: { orderBy: { order: 'asc' } },
      rafflePrizes: true,
      timingBlocks: { orderBy: { order: 'asc' } },
      publicSections: { orderBy: { order: 'asc' } },
    },
  })
  if (!game) return res.status(404).json({ error: 'Game not found or access denied' })
  res.json(game)
})

// PATCH /api/games/:id — update game settings
router.patch('/:id', requireAuth, async (req, res) => {
  const isOwner = await prisma.gameOwner.findUnique({ where: { gameId_userId: { gameId: req.params.id, userId: req.user.id } } })
  if (!isOwner) return res.status(403).json({ error: 'Forbidden' })
  const { title, eventDate, doorsOpen, homeTeamName, venueName, venueAddress, venueMapUrl, ticketingUrl, description, logoUrl } = req.body
  const game = await prisma.game.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(eventDate && { eventDate: new Date(eventDate) }),
      ...(doorsOpen !== undefined && { doorsOpen: doorsOpen ? new Date(doorsOpen) : null }),
      ...(homeTeamName && { homeTeamName }),
      ...(venueName !== undefined && { venueName }),
      ...(venueAddress !== undefined && { venueAddress }),
      ...(venueMapUrl !== undefined && { venueMapUrl }),
      ...(ticketingUrl !== undefined && { ticketingUrl }),
      ...(description !== undefined && { description }),
      ...(logoUrl !== undefined && { logoUrl }),
    },
  })
  res.json(game)
})

// POST /api/games/:id/owners — invite co-owner by email
router.post('/:id/owners', requireAuth, async (req, res) => {
  const isOwner = await prisma.gameOwner.findUnique({ where: { gameId_userId: { gameId: req.params.id, userId: req.user.id } } })
  if (!isOwner) return res.status(403).json({ error: 'Forbidden' })
  const { email } = req.body
  const invitee = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!invitee) return res.status(404).json({ error: 'No account found with that email' })
  await prisma.gameOwner.upsert({
    where: { gameId_userId: { gameId: req.params.id, userId: invitee.id } },
    update: {},
    create: { gameId: req.params.id, userId: invitee.id },
  })
  res.json({ ok: true, user: { id: invitee.id, name: invitee.name, email: invitee.email } })
})

// DELETE /api/games/:id/owners/:userId — remove co-owner
router.delete('/:id/owners/:userId', requireAuth, async (req, res) => {
  const isOwner = await prisma.gameOwner.findUnique({ where: { gameId_userId: { gameId: req.params.id, userId: req.user.id } } })
  if (!isOwner) return res.status(403).json({ error: 'Forbidden' })
  // Prevent removing the last owner
  const ownerCount = await prisma.gameOwner.count({ where: { gameId: req.params.id } })
  if (ownerCount <= 1) return res.status(400).json({ error: 'Cannot remove the last owner' })
  await prisma.gameOwner.delete({ where: { gameId_userId: { gameId: req.params.id, userId: req.params.userId } } })
  res.json({ ok: true })
})

// DELETE /api/games/:id — permanently delete a game (owner only)
router.delete('/:id', requireAuth, async (req, res) => {
  const isOwner = await prisma.gameOwner.findUnique({ where: { gameId_userId: { gameId: req.params.id, userId: req.user.id } } })
  if (!isOwner) return res.status(403).json({ error: 'Forbidden' })
  await prisma.game.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

// GET /api/games/public/:token — public info pack (no auth)
router.get('/public/:token', async (req, res) => {
  const game = await prisma.game.findUnique({
    where: { publicToken: req.params.token },
    select: {
      title: true, eventDate: true, doorsOpen: true, venueName: true, venueAddress: true,
      venueMapUrl: true, homeTeamName: true, logoUrl: true, ticketingUrl: true, description: true,
      matches: { orderBy: { order: 'asc' } },
      publicSections: { where: { visible: true }, orderBy: { order: 'asc' } },
      timingBlocks: { orderBy: { order: 'asc' } },
      teams: { select: { name: true, role: true, logoUrl: true, jerseyColour: true } },
    },
  })
  if (!game) return res.status(404).json({ error: 'Not found' })
  res.json(game)
})

// GET /api/games/guest/:token — guest team portal (no auth)
router.get('/guest/:token', async (req, res) => {
  const game = await prisma.game.findUnique({
    where: { guestToken: req.params.token },
    select: {
      id: true, title: true, eventDate: true, doorsOpen: true, venueName: true,
      venueAddress: true, venueMapUrl: true, homeTeamName: true, logoUrl: true,
      matches: { orderBy: { order: 'asc' } },
      timingBlocks: { orderBy: { order: 'asc' } },
      teams: {
        where: { role: 'VISITING' },
        include: { skaters: { orderBy: [{ benchSlot: 'asc' }, { number: 'asc' }] } },
      },
    },
  })
  if (!game) return res.status(404).json({ error: 'Not found' })
  res.json(game)
})

module.exports = router
