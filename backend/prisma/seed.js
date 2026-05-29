const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const taskTemplates = [
  // ── Setting Up (tournament only) ──────────────────────────────
  { category: 'Setting Up', name: 'Identify teams', leadTimeDays: null, eventScope: 'TOURNAMENT', order: 1 },
  { category: 'Setting Up', name: 'Reach out to teams to confirm attendance', leadTimeDays: null, eventScope: 'TOURNAMENT', order: 2 },
  { category: 'Setting Up', name: 'Sort out structure of the day', leadTimeDays: null, eventScope: 'TOURNAMENT', order: 3 },
  { category: 'Setting Up', name: 'Put together team requirements (timeouts, charter size, jersey colours etc.)', leadTimeDays: null, eventScope: 'TOURNAMENT', order: 4 },

  // ── Logistics ─────────────────────────────────────────────────
  { category: 'Logistics', name: 'Confirm date and timings with hall', leadTimeDays: 42, eventScope: 'BOTH', order: 10 },
  { category: 'Logistics', name: 'Check hall capacity', leadTimeDays: 42, eventScope: 'BOTH', order: 11 },
  { category: 'Logistics', name: 'Organise game day timings', leadTimeDays: 42, eventScope: 'BOTH', order: 12 },
  { category: 'Logistics', name: 'Complete risk assessment', leadTimeDays: 14, eventScope: 'BOTH', order: 13 },
  { category: 'Logistics', name: 'Confirm ticket prices', leadTimeDays: 42, eventScope: 'BOTH', order: 14 },
  { category: 'Logistics', name: 'Set up ticket link', leadTimeDays: 42, eventScope: 'BOTH', order: 15 },
  { category: 'Logistics', name: 'Open ticket link', leadTimeDays: 42, eventScope: 'BOTH', order: 16 },
  { category: 'Logistics', name: 'Close ticket link', leadTimeDays: 2, eventScope: 'BOTH', order: 17 },
  { category: 'Logistics', name: 'Compile guest list (visiting teams, additional guests)', leadTimeDays: 2, eventScope: 'BOTH', order: 18 },
  { category: 'Logistics', name: 'Print out ticket purchase lists', leadTimeDays: 1, eventScope: 'BOTH', order: 19 },
  { category: 'Logistics', name: 'Print out guest list', leadTimeDays: 1, eventScope: 'BOTH', order: 20 },
  { category: 'Logistics', name: 'Sort out stamp, float and cashboxes for door', leadTimeDays: 1, eventScope: 'BOTH', order: 21 },
  { category: 'Logistics', name: 'Sort out float and cashboxes for merch stand', leadTimeDays: 7, eventScope: 'BOTH', order: 22 },
  { category: 'Logistics', name: 'Check if additional signs are needed and print (see signs section)', leadTimeDays: 28, eventScope: 'BOTH', order: 23 },
  { category: 'Logistics', name: 'Book afterparty venue', leadTimeDays: 42, eventScope: 'BOTH', order: 24 },

  // ── Crew ──────────────────────────────────────────────────────
  { category: 'Crew', name: 'Book paramedics', leadTimeDays: 42, eventScope: 'BOTH', order: 30 },
  { category: 'Crew', name: 'Organise NSO crew', leadTimeDays: 56, eventScope: 'BOTH', order: 31 },
  { category: 'Crew', name: 'Organise ref crew', leadTimeDays: 56, eventScope: 'BOTH', order: 32 },
  { category: 'Crew', name: 'Confirm BBHR NSO/ref nominations', leadTimeDays: 28, eventScope: 'BOTH', order: 33 },
  { category: 'Crew', name: 'Confirm on-day NSO crew', leadTimeDays: 7, eventScope: 'BOTH', order: 34 },
  { category: 'Crew', name: 'Confirm on-day ref crew', leadTimeDays: 7, eventScope: 'BOTH', order: 35 },
  { category: 'Crew', name: 'Confirm photographers', leadTimeDays: 28, eventScope: 'BOTH', order: 36 },
  { category: 'Crew', name: 'Confirm announcers', leadTimeDays: 28, eventScope: 'BOTH', order: 37 },
  { category: 'Crew', name: 'Confirm DJ / Spotify playlist', leadTimeDays: 28, eventScope: 'BOTH', order: 38 },
  { category: 'Crew', name: 'Organise filming', leadTimeDays: 28, eventScope: 'BOTH', order: 39 },

  // ── Visiting Teams ────────────────────────────────────────────
  { category: 'Visiting Teams', name: 'Liaise with visiting team(s)', leadTimeDays: 42, eventScope: 'BOTH', order: 40 },
  { category: 'Visiting Teams', name: 'Confirm jersey colours', leadTimeDays: 28, eventScope: 'BOTH', order: 41 },
  { category: 'Visiting Teams', name: 'Get visiting team logo images for promotion', leadTimeDays: 42, eventScope: 'BOTH', order: 42 },
  { category: 'Visiting Teams', name: 'Gather headshots for home and away team', leadTimeDays: 28, eventScope: 'BOTH', order: 43 },
  { category: 'Visiting Teams', name: 'Send charter / charter in', leadTimeDays: 35, eventScope: 'BOTH', order: 44 },
  { category: 'Visiting Teams', name: 'Final charter and roster confirmation', leadTimeDays: 14, eventScope: 'BOTH', order: 45 },
  { category: 'Visiting Teams', name: 'Sort out online waiver form for event', leadTimeDays: 14, eventScope: 'BOTH', order: 46 },
  { category: 'Visiting Teams', name: 'Send skater waivers to visiting team(s)', leadTimeDays: 14, eventScope: 'BOTH', order: 47 },
  { category: 'Visiting Teams', name: 'Put together skater pack info for visiting team(s)', leadTimeDays: 28, eventScope: 'BOTH', order: 48 },
  { category: 'Visiting Teams', name: 'Send out skater pack to visiting team(s)', leadTimeDays: 14, eventScope: 'BOTH', order: 49 },
  { category: 'Visiting Teams', name: 'Send out contract', leadTimeDays: 28, eventScope: 'BOTH', order: 50 },
  { category: 'Visiting Teams', name: 'Confirm contract and waivers are signed', leadTimeDays: 7, eventScope: 'BOTH', order: 51 },

  // ── Promo ─────────────────────────────────────────────────────
  { category: 'Promo', name: 'Design bout/tournament poster for promotion', leadTimeDays: 42, eventScope: 'BOTH', order: 60 },
  { category: 'Promo', name: 'Design media for socials (FB, Insta)', leadTimeDays: 42, eventScope: 'BOTH', order: 61 },
  { category: 'Promo', name: 'Start promotions', leadTimeDays: 42, eventScope: 'BOTH', order: 62 },
  { category: 'Promo', name: 'Update website with details', leadTimeDays: 42, eventScope: 'BOTH', order: 63 },
  { category: 'Promo', name: 'Make Facebook event', leadTimeDays: 42, eventScope: 'BOTH', order: 64 },
  { category: 'Promo', name: 'Ticket page live', leadTimeDays: 42, eventScope: 'BOTH', order: 65 },
  { category: 'Promo', name: 'Design programme', leadTimeDays: 42, eventScope: 'BOTH', order: 66 },
  { category: 'Promo', name: 'Sort out digital programme link', leadTimeDays: 7, eventScope: 'BOTH', order: 67 },
  { category: 'Promo', name: 'Print programme / QR codes', leadTimeDays: 14, eventScope: 'BOTH', order: 68 },
  { category: 'Promo', name: 'Design certificates', leadTimeDays: 28, eventScope: 'BOTH', order: 69 },
  { category: 'Promo', name: 'Print certificates', leadTimeDays: 1, eventScope: 'BOTH', order: 70 },
  { category: 'Promo', name: 'Design awards (sticker, keyring, etc.)', leadTimeDays: 28, eventScope: 'BOTH', order: 71 },
  { category: 'Promo', name: 'Identify tournament cup and medals', leadTimeDays: 28, eventScope: 'TOURNAMENT', order: 72 },
  { category: 'Promo', name: 'Design tournament points tracker poster', leadTimeDays: 14, eventScope: 'TOURNAMENT', order: 73 },
  { category: 'Promo', name: 'Print tournament tracker poster (A1/A0)', leadTimeDays: 14, eventScope: 'TOURNAMENT', order: 74 },
  { category: 'Promo', name: 'Create audience choice skater vote form', leadTimeDays: 14, eventScope: 'BOTH', order: 75 },

  // ── Equipment ─────────────────────────────────────────────────
  { category: 'Equipment', name: 'Obtain PA system and ensure at venue', leadTimeDays: 28, eventScope: 'BOTH', order: 80 },
  { category: 'Equipment', name: 'Track tape — check stock, buy more if needed', leadTimeDays: 28, eventScope: 'BOTH', order: 81 },
  { category: 'Equipment', name: 'Bring track laying equipment', leadTimeDays: 0, eventScope: 'BOTH', order: 82 },
  { category: 'Equipment', name: 'Water, sweets and fruit for teams', leadTimeDays: 14, eventScope: 'BOTH', order: 83 },
  { category: 'Equipment', name: 'Snacks for NSOs and refs', leadTimeDays: 14, eventScope: 'BOTH', order: 84 },
  { category: 'Equipment', name: 'Ice packs', leadTimeDays: 28, eventScope: 'BOTH', order: 85 },
  { category: 'Equipment', name: 'Bin bags and paper towels', leadTimeDays: 14, eventScope: 'BOTH', order: 86 },
  { category: 'Equipment', name: 'Sellotape for signs', leadTimeDays: 14, eventScope: 'BOTH', order: 87 },
  { category: 'Equipment', name: 'Projector', leadTimeDays: 28, eventScope: 'BOTH', order: 88 },
  { category: 'Equipment', name: 'Screen or confirm wall space', leadTimeDays: 28, eventScope: 'BOTH', order: 89 },
  { category: 'Equipment', name: 'Laptop for scoreboard', leadTimeDays: 28, eventScope: 'BOTH', order: 90 },
  { category: 'Equipment', name: 'Whiteboards for NSO (inside and penalty box)', leadTimeDays: 28, eventScope: 'BOTH', order: 91 },
  { category: 'Equipment', name: 'Pens for NSO', leadTimeDays: 14, eventScope: 'BOTH', order: 92 },
  { category: 'Equipment', name: 'Tripod for camera', leadTimeDays: 28, eventScope: 'BOTH', order: 93 },
  { category: 'Equipment', name: 'Video camera', leadTimeDays: 28, eventScope: 'BOTH', order: 94 },
  { category: 'Equipment', name: 'Make announcer sheet', leadTimeDays: 28, eventScope: 'BOTH', order: 95 },

  // ── Stalls / Merch / Raffle ───────────────────────────────────
  { category: 'Stalls & Merch', name: 'Confirm stall details (cost, how many, who)', leadTimeDays: 42, eventScope: 'BOTH', order: 100 },
  { category: 'Stalls & Merch', name: 'Arrange stalls layout', leadTimeDays: 28, eventScope: 'BOTH', order: 101 },
  { category: 'Stalls & Merch', name: 'Confirm merch stall attendees', leadTimeDays: 14, eventScope: 'BOTH', order: 102 },
  { category: 'Stalls & Merch', name: 'Order any additional merch', leadTimeDays: 56, eventScope: 'BOTH', order: 103 },
  { category: 'Stalls & Merch', name: 'Bring merch to venue', leadTimeDays: 0, eventScope: 'BOTH', order: 104 },
  { category: 'Stalls & Merch', name: 'Ask for raffle prizes', leadTimeDays: 42, eventScope: 'BOTH', order: 105 },
  { category: 'Stalls & Merch', name: 'Confirm raffle prizes', leadTimeDays: 42, eventScope: 'BOTH', order: 106 },
  { category: 'Stalls & Merch', name: 'Collect raffle prizes', leadTimeDays: 42, eventScope: 'BOTH', order: 107 },
  { category: 'Stalls & Merch', name: 'Buy raffle ticket books', leadTimeDays: 28, eventScope: 'BOTH', order: 108 },
  { category: 'Stalls & Merch', name: 'Halftime audience game', leadTimeDays: 14, eventScope: 'BOTH', order: 109 },

  // ── Finance ───────────────────────────────────────────────────
  { category: 'Finance', name: 'Confirm ticket prices', leadTimeDays: 42, eventScope: 'BOTH', order: 110 },
  { category: 'Finance', name: 'Sort out float and cashboxes for door', leadTimeDays: 7, eventScope: 'BOTH', order: 111 },
  { category: 'Finance', name: 'Sort out float and cashboxes for merch', leadTimeDays: 7, eventScope: 'BOTH', order: 112 },

  // ── Post-Bout ─────────────────────────────────────────────────
  { category: 'Post-Bout', name: 'Edit and upload game footage', leadTimeDays: null, eventScope: 'BOTH', order: 120 },
]

const dayRoleTemplates = [
  { name: 'Main point of contact for the day', headcount: 'x2', order: 1 },
  { name: 'Team Liaison Officer (meet and greet teams)', headcount: 'x1', order: 2 },
  { name: 'Refs/NSO Liaison Officer', headcount: 'x1', order: 3 },
  { name: 'First aiders / Paramedic Liaison', headcount: 'x1', order: 4 },
  { name: 'Lay the track', headcount: 'x4', order: 5 },
  { name: 'Putting up signs', headcount: 'x1', order: 6 },
  { name: 'Setting up video recorder', headcount: 'x1', order: 7 },
  { name: 'Setting up projector and screen', headcount: 'x2', order: 8 },
  { name: 'Scoreboard laptop set-up', headcount: 'x1', order: 9 },
  { name: 'Set up penalty box', headcount: 'x1', order: 10 },
  { name: 'Set up team areas', headcount: 'x2', order: 11 },
  { name: 'Set up PA', headcount: 'x2', order: 12 },
  { name: 'Set up audience area (mats, chairs etc.)', headcount: 'x4', order: 13 },
  { name: 'Set up door', headcount: 'x2', order: 14 },
  { name: 'On the door', headcount: 'x2', order: 15 },
  { name: 'Certificates to teams', headcount: 'x1', order: 16 },
  { name: 'Merch stalls liaison', headcount: 'x1', order: 17 },
  { name: 'Set up merch stalls', headcount: 'x2', order: 18 },
  { name: 'Set up home team merch stall', headcount: 'x2', order: 19 },
  { name: 'On the merch stall', headcount: 'x2', order: 20 },
  { name: 'Set up raffle table', headcount: 'x2', order: 21 },
  { name: 'On the raffle stall', headcount: 'x1', order: 22 },
  { name: 'Halftime audience game', headcount: 'x2', order: 23 },
  { name: 'Game day social media', headcount: 'x2', order: 24 },
  { name: 'DJ', headcount: 'x1', order: 25 },
  { name: 'Announcer liaison', headcount: 'x1', order: 26 },
  { name: 'Announcer', headcount: 'x2', order: 27 },
  { name: 'Photographer', headcount: 'x4', order: 28 },
  { name: 'LUM Bag', headcount: 'x1', order: 29 },
  { name: 'Water at benches', headcount: 'x1', order: 30 },
  { name: 'Snacks to NSOs', headcount: 'x1', order: 31 },
  { name: 'Clean up between games', headcount: 'x4', order: 32 },
  { name: 'Clean up at end of event', headcount: 'ALL', order: 33 },
  { name: 'Head Ref + ref crew', headcount: 'x1', order: 34 },
  { name: 'Head NSO + NSO crew', headcount: 'x1', order: 35 },
  { name: 'Track repair', headcount: 'x4', order: 36 },
  { name: 'Afterparty', headcount: 'ANYONE', order: 37 },
  { name: 'Camera operator', headcount: 'x1', order: 38 },
  { name: 'Captain', headcount: 'x2', order: 39 },
  { name: 'Bench crew', headcount: 'x4', order: 40 },
]

const defaultSigns = [
  { name: 'Penalty box signs', copies: '2 sets (2×B, 1×J)', notes: 'Check with Abi — may already be laminated', order: 1 },
  { name: 'Team kit area', copies: 'x2', notes: null, order: 2 },
  { name: 'Bathroom — let skaters go first', copies: 'x4', notes: null, order: 3 },
  { name: 'Danger zone area', copies: 'x4', notes: null, order: 4 },
  { name: 'Cost sign for door', copies: 'x1', notes: null, order: 5 },
  { name: 'Digital programme QR code', copies: 'x2', notes: null, order: 6 },
  { name: 'Audience Choice Award', copies: 'x2', notes: null, order: 7 },
  { name: 'Timing lists', copies: 'x6', notes: '1 for refs/NSO, 1 per team, 1 on the door', order: 8 },
]

async function main() {
  console.log('Seeding task templates...')
  for (const t of taskTemplates) {
    await prisma.taskTemplate.upsert({
      where: { name_category: { name: t.name, category: t.category } },
      update: { leadTimeDays: t.leadTimeDays, isRequired: t.isRequired ?? false, eventScope: t.eventScope, order: t.order },
      create: t,
    })
  }

  console.log('Seeding day role templates...')
  for (const r of dayRoleTemplates) {
    await prisma.dayRoleTemplate.upsert({
      where: { name: r.name },
      update: { headcount: r.headcount, order: r.order },
      create: r,
    })
  }

  console.log('Done.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
