/**
 * Pre-migration script — runs before `prisma db push`.
 *
 * Handles columns that Prisma can't auto-add to non-empty tables because they
 * use a JS-level @default(uuid()) rather than a PostgreSQL-level default.
 * We use gen_random_uuid() here so PostgreSQL can backfill existing rows.
 */
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('[premigrate] Running pre-migration fixes...')

  // Add token columns on Game if they don't already exist.
  // Using ADD COLUMN IF NOT EXISTS + gen_random_uuid() so existing rows get values.
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Game"
      ADD COLUMN IF NOT EXISTS "guestToken"     TEXT DEFAULT gen_random_uuid()::text,
      ADD COLUMN IF NOT EXISTS "publicToken"    TEXT DEFAULT gen_random_uuid()::text,
      ADD COLUMN IF NOT EXISTS "volunteerToken" TEXT DEFAULT gen_random_uuid()::text
  `)

  // Backfill any NULLs (in case rows existed before columns were added)
  await prisma.$executeRawUnsafe(`
    UPDATE "Game"
    SET
      "guestToken"     = gen_random_uuid()::text WHERE "guestToken"     IS NULL;
  `)
  await prisma.$executeRawUnsafe(`
    UPDATE "Game"
    SET
      "publicToken"    = gen_random_uuid()::text WHERE "publicToken"    IS NULL;
  `)
  await prisma.$executeRawUnsafe(`
    UPDATE "Game"
    SET
      "volunteerToken" = gen_random_uuid()::text WHERE "volunteerToken" IS NULL;
  `)

  // Create unique indexes if they don't exist (Prisma db push expects these)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Game_guestToken_key"     ON "Game"("guestToken")
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Game_publicToken_key"    ON "Game"("publicToken")
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Game_volunteerToken_key" ON "Game"("volunteerToken")
  `)

  // Deduplicate TaskTemplate: for each (name, category) group, keep the min(id)
  // as canonical; re-point any GameTask references to it; then delete the rest.
  console.log('[premigrate] Deduplicating TaskTemplate...')
  await prisma.$executeRawUnsafe(`
    UPDATE "GameTask" gt
    SET "templateId" = canonical."canonicalId"
    FROM (
      SELECT name, category, MIN(id) AS "canonicalId"
      FROM "TaskTemplate"
      GROUP BY name, category
      HAVING COUNT(*) > 1
    ) canonical
    JOIN "TaskTemplate" tt
      ON tt.name = canonical.name
     AND tt.category = canonical.category
     AND tt.id != canonical."canonicalId"
    WHERE gt."templateId" = tt.id
  `)
  await prisma.$executeRawUnsafe(`
    DELETE FROM "TaskTemplate"
    WHERE id NOT IN (
      SELECT MIN(id) FROM "TaskTemplate" GROUP BY name, category
    )
  `)

  // Deduplicate DayRoleTemplate: for each name group, keep the min(id)
  // as canonical; re-point any GameDayRole references to it; then delete the rest.
  console.log('[premigrate] Deduplicating DayRoleTemplate...')
  await prisma.$executeRawUnsafe(`
    UPDATE "GameDayRole" gr
    SET "templateId" = canonical."canonicalId"
    FROM (
      SELECT name, MIN(id) AS "canonicalId"
      FROM "DayRoleTemplate"
      GROUP BY name
      HAVING COUNT(*) > 1
    ) canonical
    JOIN "DayRoleTemplate" dt
      ON dt.name = canonical.name
     AND dt.id != canonical."canonicalId"
    WHERE gr."templateId" = dt.id
  `)
  await prisma.$executeRawUnsafe(`
    DELETE FROM "DayRoleTemplate"
    WHERE id NOT IN (
      SELECT MIN(id) FROM "DayRoleTemplate" GROUP BY name
    )
  `)

  console.log('[premigrate] Done.')
}

main()
  .catch(e => { console.error('[premigrate] Error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
