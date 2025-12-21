/**
 * Database Seed Script
 * Populates the database with deterministic, realistic demo data
 *
 * Usage:
 *   npm run db:seed          # Full demo seed
 *   npm run db:seed:dev      # Minimal dev seed (fast)
 *   npm run db:seed -- --org finbank-eu  # Single org only
 *
 * Features:
 * - Deterministic data (no random generation)
 * - Realistic regulatory content from DORA/GDPR
 * - Proper organization isolation
 * - Fixed due dates relative to seed date
 */

import { and, eq } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'
import { db } from './index'
import {
  alerts,
  articles,
  articleSystemImpacts,
  auditLog,
  evidencePacks,
  ingestJobs,
  member,
  obligations,
  obligationSystemMappings,
  organization,
  regulations,
  systems,
  user,
} from './schema'
import {
  ALERTS,
  getArticlesForFramework,
  getObligationsForFramework,
  ORGANIZATIONS,
  REGULATIONS,
  SYSTEMS,
  USERS,
} from './seed-data'

// =============================================================================
// Configuration
// =============================================================================

interface SeedConfig {
  mode: 'dev' | 'demo'
  organizations?: string[] // Filter to specific orgs
  clearExisting: boolean
  verbose: boolean
}

function parseArgs(): SeedConfig {
  const args = process.argv.slice(2)
  const config: SeedConfig = {
    mode: 'demo',
    clearExisting: true,
    verbose: true,
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dev') config.mode = 'dev'
    if (args[i] === '--org' && args[i + 1]) {
      config.organizations = config.organizations || []
      config.organizations.push(args[++i])
    }
    if (args[i] === '--no-clear') config.clearExisting = false
    if (args[i] === '--quiet') config.verbose = false
  }

  return config
}

// =============================================================================
// Seed Functions
// =============================================================================

async function clearDatabase(verbose: boolean) {
  if (verbose) console.log('🗑️  Clearing existing data...')

  // Clear in reverse dependency order
  await db.delete(auditLog)
  await db.delete(evidencePacks)
  await db.delete(alerts)
  await db.delete(obligationSystemMappings)
  await db.delete(articleSystemImpacts)
  await db.delete(obligations)
  await db.delete(articles)
  await db.delete(regulations)
  await db.delete(ingestJobs)
  await db.delete(systems)
  // Don't clear users/orgs/memberships - they may be created via auth

  if (verbose) console.log('   ✓ Cleared compliance data\n')
}

async function ensureOrganizations(orgs: typeof ORGANIZATIONS, verbose: boolean) {
  if (verbose) console.log('🏢 Seeding organizations...')

  for (const org of orgs) {
    const existing = await db.select().from(organization).where(eq(organization.id, org.id))
    if (existing.length === 0) {
      await db.insert(organization).values({
        id: org.id,
        name: org.name,
        slug: org.slug,
        metadata: JSON.stringify(org.metadata),
        createdAt: new Date(),
      })
    }
  }

  if (verbose) console.log(`   ✓ Ensured ${orgs.length} organizations\n`)
}

async function ensureUsers(users: typeof USERS, verbose: boolean) {
  if (verbose) console.log('👤 Seeding users...')

  for (const u of users) {
    const existing = await db.select().from(user).where(eq(user.id, u.id))
    if (existing.length === 0) {
      await db.insert(user).values({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: new Date(),
      })
    }
  }

  if (verbose) console.log(`   ✓ Ensured ${users.length} users\n`)
}

async function ensureMemberships(users: typeof USERS, verbose: boolean) {
  if (verbose) console.log('🔗 Seeding memberships...')

  let count = 0
  for (const u of users) {
    const existing = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, u.organizationId), eq(member.userId, u.id)))
    if (existing.length === 0) {
      await db.insert(member).values({
        id: `m-${u.id}`,
        organizationId: u.organizationId,
        userId: u.id,
        role: u.role,
        createdAt: new Date(),
      })
      count++
    }
  }

  if (verbose) console.log(`   ✓ Ensured ${count} memberships\n`)
}

async function seedOrganizationData(
  orgId: string,
  mode: 'dev' | 'demo',
  verbose: boolean
): Promise<{
  regs: number
  arts: number
  obls: number
  systems: number
  alerts: number
  mappings: number
}> {
  const stats = { regs: 0, arts: 0, obls: 0, systems: 0, alerts: 0, mappings: 0 }

  if (verbose) console.log(`\n📦 Seeding data for ${orgId}...`)

  // Create ingest job for provenance
  const ingestJobId = `${orgId}-seed-${Date.now()}`
  const ingestTimestamp = new Date()
  await db.insert(ingestJobs).values({
    id: ingestJobId,
    organizationId: orgId,
    source: 'seed',
    status: 'succeeded',
    startedAt: ingestTimestamp,
    finishedAt: ingestTimestamp,
    log: JSON.stringify({ mode, seedVersion: '2.0' }),
  })

  // Seed regulations
  const orgRegs = REGULATIONS[orgId] || []
  const regulationMap: Record<string, string> = {} // framework -> regulationId

  for (const reg of orgRegs) {
    await db.insert(regulations).values({
      id: reg.id,
      organizationId: orgId,
      slug: reg.slug,
      framework: reg.framework,
      version: reg.version,
      name: reg.name,
      fullTitle: reg.fullTitle,
      jurisdiction: reg.jurisdiction,
      effectiveDate: reg.effectiveDate,
      status: reg.status,
      sourceType: reg.sourceType,
      sourceUrl: reg.sourceUrl,
      ingestJobId,
      ingestTimestamp,
    })
    regulationMap[reg.framework] = reg.id
    stats.regs++
  }

  if (verbose) console.log(`   ✓ ${stats.regs} regulations`)

  // Seed articles with realistic content
  const articleMap: Record<string, string> = {} // "framework:articleNumber" -> articleId

  for (const reg of orgRegs) {
    const frameworkArticles = getArticlesForFramework(reg.framework)
    // In dev mode, only seed first 2 articles per regulation
    const articlesToSeed = mode === 'dev' ? frameworkArticles.slice(0, 2) : frameworkArticles

    for (const art of articlesToSeed) {
      const articleId = `${reg.id}-${art.articleNumber.toLowerCase().replace(/\s+/g, '-')}`
      await db.insert(articles).values({
        id: articleId,
        organizationId: orgId,
        regulationId: reg.id,
        articleNumber: art.articleNumber,
        sectionTitle: art.sectionTitle,
        title: art.title,
        rawText: art.rawText,
        normalizedText: art.normalizedText,
        reviewStatus: 'pending',
        ingestJobId,
        ingestTimestamp,
        createdAt: ingestTimestamp,
      })
      articleMap[`${reg.framework}:${art.articleNumber}`] = articleId
      stats.arts++
    }
  }

  if (verbose) console.log(`   ✓ ${stats.arts} articles`)

  // Seed obligations with deterministic due dates
  const seedDate = new Date()
  const obligationMap: Record<string, string> = {} // referenceCode -> obligationId

  for (const reg of orgRegs) {
    const frameworkObligations = getObligationsForFramework(reg.framework)
    // In dev mode, only seed first 3 obligations per regulation
    const oblsToSeed = mode === 'dev' ? frameworkObligations.slice(0, 3) : frameworkObligations

    for (const obl of oblsToSeed) {
      const articleId = articleMap[`${reg.framework}:${obl.articleRef}`]
      if (!articleId) continue // Skip if article not seeded

      const obligationId = `${orgId}-${obl.referenceCode}`
      const dueDate = new Date(seedDate)
      dueDate.setDate(dueDate.getDate() + obl.dueInDays)

      await db.insert(obligations).values({
        id: obligationId,
        organizationId: orgId,
        regulationId: reg.id,
        articleId,
        referenceCode: obl.referenceCode,
        title: obl.title,
        summary: obl.summary,
        status: obl.status,
        riskLevel: obl.riskLevel,
        requirementType: obl.requirementType,
        dueDate,
        sourceType: 'llm',
        ingestJobId,
        ingestTimestamp,
        createdAt: ingestTimestamp,
      })
      obligationMap[obl.referenceCode] = obligationId
      stats.obls++
    }
  }

  if (verbose) console.log(`   ✓ ${stats.obls} obligations`)

  // Seed systems
  const orgSystems = SYSTEMS[orgId] || []
  const systemsToSeed = mode === 'dev' ? orgSystems.slice(0, 2) : orgSystems

  for (const sys of systemsToSeed) {
    await db.insert(systems).values({
      id: sys.id,
      organizationId: orgId,
      slug: sys.id,
      name: sys.name,
      description: sys.description,
      category: sys.category,
      criticality: sys.criticality,
      dataClassification: sys.metadata?.dataClassification,
      tags: sys.tags,
      externalId: sys.externalId,
      externalSource: sys.metadata?.cloudProvider,
      createdAt: ingestTimestamp,
    })
    stats.systems++
  }

  if (verbose) console.log(`   ✓ ${stats.systems} systems`)

  // Seed obligation-system mappings (deterministic pattern)
  const allObls = await db.query.obligations.findMany({
    where: eq(obligations.organizationId, orgId),
  })

  for (let i = 0; i < allObls.length; i++) {
    // Map each obligation to system based on index (deterministic)
    const sysIndex = i % systemsToSeed.length
    const sys = systemsToSeed[sysIndex]

    // Determine confidence based on obligation risk level
    const obl = allObls[i]
    const confidence = obl.riskLevel === 'critical' ? 'high' : obl.riskLevel === 'high' ? 'medium' : 'low'

    await db.insert(obligationSystemMappings).values({
      organizationId: orgId,
      obligationId: obl.id,
      systemId: sys.id,
      mappingConfidence: confidence as 'low' | 'medium' | 'high',
      mappedBy: 'human',
      reason: `Mapped to ${sys.name} based on requirement type and system category`,
    })
    stats.mappings++
  }

  if (verbose) console.log(`   ✓ ${stats.mappings} obligation-system mappings`)

  // Seed article-system impacts (deterministic)
  const allArts = await db.query.articles.findMany({
    where: eq(articles.organizationId, orgId),
  })

  for (let i = 0; i < allArts.length; i++) {
    // Create impact for each article to specific system
    const sysIndex = i % systemsToSeed.length
    const sys = systemsToSeed[sysIndex]
    const impactLevels = ['low', 'medium', 'high', 'critical'] as const
    const impactLevel = impactLevels[Math.min(3, Math.floor(i / 2))]

    await db.insert(articleSystemImpacts).values({
      organizationId: orgId,
      articleId: allArts[i].id,
      systemId: sys.id,
      impactLevel,
    })
  }

  if (verbose) console.log(`   ✓ ${allArts.length} article-system impacts`)

  // Seed alerts
  const orgAlerts = ALERTS.filter((a) => a.organizationId === orgId)
  const alertsToSeed = mode === 'dev' ? orgAlerts.slice(0, 2) : orgAlerts

  for (const alert of alertsToSeed) {
    const createdAt = new Date(seedDate)
    createdAt.setDate(createdAt.getDate() - alert.createdDaysAgo)

    await db.insert(alerts).values({
      id: alert.id,
      organizationId: orgId,
      type: alert.type,
      severity: alert.severity,
      status: alert.status,
      title: alert.title,
      description: alert.description,
      regulationId: alert.regulationRef ? regulationMap[alert.regulationRef] : null,
      obligationId: alert.obligationRef ? obligationMap[alert.obligationRef] : null,
      assignedToUserId: alert.assignedTo,
      resolvedAt: alert.resolvedAt,
      createdAt,
    })
    stats.alerts++
  }

  if (verbose) console.log(`   ✓ ${stats.alerts} alerts`)

  // Seed evidence packs
  const evidencePacksData = [
    {
      title: 'DORA Compliance Evidence Q4 2024',
      description: 'Evidence pack demonstrating compliance with DORA ICT risk management requirements.',
      framework: 'DORA',
      jurisdiction: 'EU',
      status: 'ready' as const,
      regulationRef: 'DORA',
      intendedAudience: 'auditor',
      exportFormat: 'pdf',
    },
    {
      title: 'GDPR Article 32 Security Controls',
      description: 'Technical and organizational security measures documentation for GDPR compliance.',
      framework: 'GDPR',
      jurisdiction: 'EU',
      status: 'draft' as const,
      regulationRef: 'GDPR',
      intendedAudience: 'internal',
      exportFormat: 'json',
    },
  ]

  const packsToSeed = mode === 'dev' ? evidencePacksData.slice(0, 1) : evidencePacksData

  for (const pack of packsToSeed) {
    await db.insert(evidencePacks).values({
      organizationId: orgId,
      title: pack.title,
      description: pack.description,
      framework: pack.framework,
      jurisdiction: pack.jurisdiction,
      status: pack.status,
      regulationId: regulationMap[pack.regulationRef],
      intendedAudience: pack.intendedAudience,
      exportFormat: pack.exportFormat,
      generatedAt: pack.status === 'ready' ? ingestTimestamp : undefined,
    })
  }

  if (verbose) console.log(`   ✓ ${packsToSeed.length} evidence packs`)

  // Seed audit log entry
  const adminUser = USERS.find((u) => u.organizationId === orgId && u.role === 'OrgAdmin')
  if (adminUser) {
    await db.insert(auditLog).values({
      organizationId: orgId,
      actorUserId: adminUser.id,
      action: 'seed_database',
      entityType: 'organization',
      entityId: orgId,
      diff: { mode, timestamp: ingestTimestamp.toISOString() },
    })
  }

  return stats
}

// =============================================================================
// Main Seed Function
// =============================================================================

async function seed() {
  const config = parseArgs()
  const startTime = Date.now()

  console.log('🌱 Starting database seed...')
  console.log(`   Mode: ${config.mode}`)
  if (config.organizations) {
    console.log(`   Organizations: ${config.organizations.join(', ')}`)
  }
  console.log('')

  try {
    if (config.clearExisting) {
      await clearDatabase(config.verbose)
    }

    // Filter organizations if specified
    const orgsToSeed = config.organizations
      ? ORGANIZATIONS.filter((o) => config.organizations!.includes(o.id))
      : ORGANIZATIONS

    const usersToSeed = config.organizations
      ? USERS.filter((u) => config.organizations!.includes(u.organizationId))
      : USERS

    await ensureOrganizations(orgsToSeed, config.verbose)
    await ensureUsers(usersToSeed, config.verbose)
    await ensureMemberships(usersToSeed, config.verbose)

    // Aggregate stats
    const totals = { regs: 0, arts: 0, obls: 0, systems: 0, alerts: 0, mappings: 0 }

    for (const org of orgsToSeed) {
      const stats = await seedOrganizationData(org.id, config.mode, config.verbose)
      totals.regs += stats.regs
      totals.arts += stats.arts
      totals.obls += stats.obls
      totals.systems += stats.systems
      totals.alerts += stats.alerts
      totals.mappings += stats.mappings
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Database seeded successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`
Summary (${config.mode} mode):
  • ${orgsToSeed.length} organizations
  • ${usersToSeed.length} users
  • ${totals.regs} regulations
  • ${totals.arts} articles (with real regulatory text)
  • ${totals.obls} obligations (deterministic due dates)
  • ${totals.systems} systems
  • ${totals.mappings} obligation-system mappings
  • ${totals.alerts} alerts

Duration: ${duration}s
`)

    return { totals, orgsToSeed, usersToSeed }
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

// =============================================================================
// Snapshot Generation
// =============================================================================

function generateSnapshot(orgs: typeof ORGANIZATIONS, users: typeof USERS) {
  const lines: string[] = []

  lines.push('# Seed Snapshot')
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')
  lines.push('## Organizations')
  lines.push('')
  for (const org of orgs) {
    lines.push(`- **${org.name}** (\`${org.id}\`)`)
    lines.push(`  - Jurisdiction: ${org.metadata.primary_jurisdiction}`)
    lines.push(`  - Industry: ${org.metadata.industry}`)
    lines.push(`  - Frameworks: ${org.metadata.frameworks.join(', ')}`)
  }

  lines.push('')
  lines.push('## Demo Logins')
  lines.push('')
  lines.push('| Email | Organization | Role |')
  lines.push('|-------|--------------|------|')
  for (const u of users) {
    const org = orgs.find((o) => o.id === u.organizationId)
    lines.push(`| ${u.email} | ${org?.name} | ${u.role} |`)
  }

  lines.push('')
  lines.push('## Data Hierarchy Example')
  lines.push('')
  lines.push('```')
  lines.push('Regulation: DORA (finbank-dora)')
  lines.push('  └── Article: Article 5 - Governance')
  lines.push('      └── Obligation: DORA-5-001 - Establish ICT Risk Governance Framework')
  lines.push('          └── System: CoreBanking Platform')
  lines.push('              └── Alert: Third-party risk assessments overdue')
  lines.push('```')

  lines.push('')
  lines.push('## Role Permissions')
  lines.push('')
  lines.push('| Role | Permissions |')
  lines.push('|------|-------------|')
  lines.push('| OrgAdmin | Full access, manage users, delete data |')
  lines.push('| ComplianceManager | Create/edit compliance data, manage alerts |')
  lines.push('| Auditor | Read-only access, view evidence packs |')
  lines.push('| Viewer | Read-only dashboard access |')
  lines.push('| BillingAdmin | Billing and subscription management |')

  return lines.join('\n')
}

// =============================================================================
// Entry Point
// =============================================================================

seed()
  .then(({ orgsToSeed, usersToSeed }) => {
    console.log('🎉 Seed complete!')

    // Generate seed snapshot
    try {
      const snapshot = generateSnapshot(orgsToSeed, usersToSeed)
      const outPath = path.join(process.cwd(), 'scripts', 'seed-snapshot.md')
      fs.writeFileSync(outPath, snapshot)
      console.log(`📝 Wrote seed snapshot to ${outPath}`)
    } catch (e) {
      console.warn('⚠️  Failed to write seed snapshot', e)
    }

    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to seed database:', error)
    process.exit(1)
  })
