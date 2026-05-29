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

  // Deduplicate TaskTemplate: keep only rows referenced by GameTask,
  // or the first encountered for each (name, category) pair if none are referenced.
  console.log('[premigrate] Deduplicating TaskTemplate...')
  await prisma.$executeRawUnsafe(`
    DELETE FROM "TaskTemplate"
    WHERE id IN (
      SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY name, category ORDER BY id) AS rn
        FROM "TaskTemplate"
        WHERE id NOT IN (SELECT COALESCE("templateId", '') FROM "GameTask" WHERE "templateId" IS NOT NULL)
      ) dupes
      WHERE rn > 1
    )
  `)

  // Deduplicate DayRoleTemplate: keep only rows referenced by GameDayRole,
  // or the first per name if none are referenced.
  console.log('[premigrate] Deduplicating DayRoleTemplate...')
  await prisma.$executeRawUnsafe(`
    DELETE FROM "DayRoleTemplate"
    WHERE id IN (
      SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) AS rn
        FROM "DayRoleTemplate"
        WHERE id NOT IN (SELECT COALESCE("templateId", '') FROM "GameDayRole" WHERE "templateId" IS NOT NULL)
      ) dupes
      WHERE rn > 1
    )
  `)

  console.log('[premigrate] Done.')
}

main()
  .catch(e => { console.error('[premigrate] Error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
