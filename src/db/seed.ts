/**
 * Database Seed Script
 * Populates the database with realistic demo data for Cindral
 * Ensures proper organization isolation and multi-tenancy
 *
 * Run with: npm run db:seed
 */

import { and, eq } from 'drizzle-orm'
import { db } from './index'
import type { Member, Organization, User } from './schema'
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
  regulatoryChanges,
  systems,
  user,
} from './schema'
import fs from 'fs'
import path from 'path'

// ============================================================================
// DEMO ORGANIZATIONS
// ============================================================================

const organizationsSeed = [
  {
    id: 'finbank-eu',
    name: 'FinBank EU',
    slug: 'finbank-eu',
    metadata: JSON.stringify({
      primary_jurisdiction: 'EU',
      industry: 'banking',
      size_band: 'large',
      risk_appetite: 'moderate',
      frameworks: ['DORA', 'PSD2', 'GDPR'],
    }),
    createdAt: new Date(),
  },
  {
    id: 'paytech-uk',
    name: 'PayTech UK',
    slug: 'paytech-uk',
    metadata: JSON.stringify({
      primary_jurisdiction: 'UK',
      industry: 'payments',
      size_band: 'medium',
      risk_appetite: 'conservative',
      frameworks: ['DORA', 'GDPR'],
    }),
    createdAt: new Date(),
  },
]

// ============================================================================
// DEMO USERS & MEMBERSHIPS
// ============================================================================

const usersSeed = [
  // FinBank EU users
  { id: 'finbank-admin', name: 'FinBank Admin', email: 'admin+finbank@cindral.dev', createdAt: new Date() },
  { id: 'finbank-comp', name: 'FinBank Compliance', email: 'compliance+finbank@cindral.dev', createdAt: new Date() },
  { id: 'finbank-auditor', name: 'FinBank Auditor', email: 'auditor+finbank@cindral.dev', createdAt: new Date() },
  { id: 'finbank-viewer', name: 'FinBank Viewer', email: 'viewer+finbank@cindral.dev', createdAt: new Date() },
  // PayTech UK users
  { id: 'paytech-admin', name: 'PayTech Admin', email: 'admin+paytech@cindral.dev', createdAt: new Date() },
  { id: 'paytech-comp', name: 'PayTech Compliance', email: 'compliance+paytech@cindral.dev', createdAt: new Date() },
  { id: 'paytech-auditor', name: 'PayTech Auditor', email: 'auditor+paytech@cindral.dev', createdAt: new Date() },
  { id: 'paytech-viewer', name: 'PayTech Viewer', email: 'viewer+paytech@cindral.dev', createdAt: new Date() },
]

const membershipsSeed = [
  // FinBank EU memberships
  {
    id: 'm-finbank-admin',
    organizationId: 'finbank-eu',
    userId: 'finbank-admin',
    role: 'OrgAdmin',
    createdAt: new Date(),
  },
  {
    id: 'm-finbank-comp',
    organizationId: 'finbank-eu',
    userId: 'finbank-comp',
    role: 'ComplianceManager',
    createdAt: new Date(),
  },
  {
    id: 'm-finbank-aud',
    organizationId: 'finbank-eu',
    userId: 'finbank-auditor',
    role: 'Auditor',
    createdAt: new Date(),
  },
  {
    id: 'm-finbank-view',
    organizationId: 'finbank-eu',
    userId: 'finbank-viewer',
    role: 'Viewer',
    createdAt: new Date(),
  },
  // PayTech UK memberships
  {
    id: 'm-paytech-admin',
    organizationId: 'paytech-uk',
    userId: 'paytech-admin',
    role: 'OrgAdmin',
    createdAt: new Date(),
  },
  {
    id: 'm-paytech-comp',
    organizationId: 'paytech-uk',
    userId: 'paytech-comp',
    role: 'ComplianceManager',
    createdAt: new Date(),
  },
  {
    id: 'm-paytech-aud',
    organizationId: 'paytech-uk',
    userId: 'paytech-auditor',
    role: 'Auditor',
    createdAt: new Date(),
  },
  {
    id: 'm-paytech-view',
    organizationId: 'paytech-uk',
    userId: 'paytech-viewer',
    role: 'Viewer',
    createdAt: new Date(),
  },
]

// ============================================================================
// REGULATIONS (Per-org, not global)
// ============================================================================

const regulationsPerOrg = {
  'finbank-eu': [
    {
      id: 'finbank-dora',
      slug: 'dora',
      framework: 'DORA',
      version: '1.0',
      name: 'DORA',
      fullTitle: 'Digital Operational Resilience Act (EU) 2022/2554',
      jurisdiction: 'European Union',
      effectiveDate: new Date('2025-01-17'),
      status: 'active' as const,
      sourceType: 'eur-lex' as const,
    },
    {
      id: 'finbank-gdpr',
      slug: 'gdpr',
      framework: 'GDPR',
      version: '1.0',
      name: 'GDPR',
      fullTitle: 'General Data Protection Regulation (EU) 2016/679',
      jurisdiction: 'European Union',
      effectiveDate: new Date('2018-05-25'),
      status: 'active' as const,
      sourceType: 'eur-lex' as const,
    },
  ],
  'paytech-uk': [
    {
      id: 'paytech-dora',
      slug: 'dora',
      framework: 'DORA',
      version: '1.0',
      name: 'DORA',
      fullTitle: 'Digital Operational Resilience Act (EU) 2022/2554',
      jurisdiction: 'European Union',
      effectiveDate: new Date('2025-01-17'),
      status: 'active' as const,
      sourceType: 'eur-lex' as const,
    },
    {
      id: 'paytech-gdpr',
      slug: 'gdpr',
      framework: 'GDPR',
      version: '1.0',
      name: 'GDPR',
      fullTitle: 'General Data Protection Regulation (EU) 2016/679',
      jurisdiction: 'European Union',
      effectiveDate: new Date('2018-05-25'),
      status: 'active' as const,
      sourceType: 'eur-lex' as const,
    },
  ],
}

// ============================================================================
// ARTICLES (Per-org)
// ============================================================================

function generateArticles(orgId: string, regulationId: string, prefix: string) {
  const doraArticles = [
    { num: 'Article 5', title: 'ICT Risk Management Framework', riskLevel: 'critical' },
    { num: 'Article 6', title: 'ICT Systems and Tools', riskLevel: 'high' },
    { num: 'Article 11', title: 'ICT Third-Party Risk', riskLevel: 'critical' },
    { num: 'Article 17', title: 'ICT Incident Classification', riskLevel: 'high' },
    { num: 'Article 19', title: 'Incident Reporting', riskLevel: 'critical' },
    { num: 'Article 24', title: 'Digital Operational Resilience Testing', riskLevel: 'high' },
    { num: 'Article 28', title: 'ICT Third-Party Service Providers', riskLevel: 'critical' },
  ]

  const gdprArticles = [
    { num: 'Article 5', title: 'Principles of Processing', riskLevel: 'critical' },
    { num: 'Article 6', title: 'Lawfulness of Processing', riskLevel: 'critical' },
    { num: 'Article 17', title: 'Right to Erasure', riskLevel: 'high' },
    { num: 'Article 25', title: 'Data Protection by Design', riskLevel: 'high' },
    { num: 'Article 32', title: 'Security of Processing', riskLevel: 'critical' },
    { num: 'Article 33', title: 'Breach Notification', riskLevel: 'critical' },
    { num: 'Article 35', title: 'Data Protection Impact Assessment', riskLevel: 'high' },
  ]

  const articles = regulationId.includes('dora') ? doraArticles : gdprArticles

  return articles.map((art, i) => ({
    id: `${prefix}-art-${i + 1}`,
    organizationId: orgId,
    regulationId,
    articleNumber: art.num,
    sectionTitle: art.title,
    title: art.title,
    rawText: `Full text of ${art.num} - ${art.title}`,
    reviewStatus: 'pending' as const,
    createdAt: new Date(),
  }))
}

// ============================================================================
// OBLIGATIONS (Per-org)
// ============================================================================

function generateObligations(orgId: string, regulationId: string, articleIds: string[], prefix: string) {
  const statuses = ['not_started', 'in_progress', 'implemented', 'under_review', 'verified'] as const
  const riskLevels = ['low', 'medium', 'high', 'critical'] as const
  const reqTypes = ['process', 'technical', 'reporting'] as const

  const obls = []
  let oblCounter = 1

  for (const articleId of articleIds) {
    // Generate 3-5 obligations per article
    const count = 3 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      obls.push({
        id: `${prefix}-OBL-${String(oblCounter++).padStart(3, '0')}`,
        organizationId: orgId,
        regulationId,
        articleId,
        referenceCode: `${prefix.toUpperCase()}-${articleId.split('-').pop()}-${i + 1}`,
        title: `Obligation ${oblCounter - 1} for ${articleId}`,
        summary: `Compliance requirement derived from article`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
        requirementType: reqTypes[Math.floor(Math.random() * reqTypes.length)],
        sourceType: 'llm' as const,
        createdAt: new Date(),
      })
    }
  }

  return obls
}

// ============================================================================
// SYSTEMS (Per-org)
// ============================================================================

const systemsPerOrg = {
  'finbank-eu': [
    { id: 'finbank-core-banking', name: 'CoreBanking', category: 'core banking', criticality: 'critical' as const },
    { id: 'finbank-payments-switch', name: 'PaymentsSwitch', category: 'payments', criticality: 'critical' as const },
    {
      id: 'finbank-customer-portal',
      name: 'CustomerPortal',
      category: 'customer facing',
      criticality: 'high' as const,
    },
    { id: 'finbank-cloud-data-lake', name: 'CloudDataLake', category: 'data', criticality: 'high' as const },
  ],
  'paytech-uk': [
    { id: 'paytech-checkout-api', name: 'CheckoutAPI', category: 'payments', criticality: 'critical' as const },
    { id: 'paytech-fraud-engine', name: 'FraudEngine', category: 'security', criticality: 'critical' as const },
    { id: 'paytech-support-desk', name: 'SupportDesk', category: 'support', criticality: 'medium' as const },
    { id: 'paytech-compliance-grc', name: 'ComplianceGRC', category: 'compliance', criticality: 'high' as const },
  ],
}

// ============================================================================
// ALERTS (Per-org)
// ============================================================================

function generateAlerts(orgId: string, regulationIds: string[]) {
  const types = ['obligation_overdue', 'regulation_changed', 'evidence_pack_failed', 'system_unmapped'] as const
  const severities = ['info', 'low', 'medium', 'high', 'critical'] as const
  const statuses = ['open', 'in_triage', 'in_progress', 'resolved', 'wont_fix'] as const

  return [
    {
      id: `${orgId}-ALT-001`,
      organizationId: orgId,
      type: 'obligation_overdue' as const,
      severity: 'critical' as const,
      status: 'open' as const,
      title: 'Monthly third-party risk assessments overdue',
      description: 'DORA Article 11 requires monthly assessments. Last assessment was 45 days ago.',
      regulationId: regulationIds[0],
    },
    {
      id: `${orgId}-ALT-002`,
      organizationId: orgId,
      type: 'regulation_changed' as const,
      severity: 'high' as const,
      status: 'in_triage' as const,
      title: 'New technical standards published for DORA',
      description: 'ESAs published final technical standards affecting incident reporting.',
      regulationId: regulationIds[0],
    },
    {
      id: `${orgId}-ALT-003`,
      organizationId: orgId,
      type: 'system_unmapped' as const,
      severity: 'medium' as const,
      status: 'open' as const,
      title: 'System not mapped to any obligations',
      description: 'CloudDataLake has no obligation mappings.',
    },
    {
      id: `${orgId}-ALT-004`,
      organizationId: orgId,
      type: 'evidence_pack_failed' as const,
      severity: 'low' as const,
      status: 'resolved' as const,
      title: 'Evidence pack generation failed',
      description: 'GDPR evidence pack generation failed due to timeout.',
      regulationId: regulationIds[1],
      resolvedAt: new Date(),
    },
  ]
}

// ============================================================================
// EVIDENCE PACKS (Per-org)
// ============================================================================

function generateEvidencePacks(orgId: string, regulationIds: string[]) {
  const statuses = ['draft', 'generating', 'ready', 'failed', 'archived'] as const
  const audiences = ['internal', 'auditor', 'regulator'] as const

  return [
    {
      organizationId: orgId,
      title: 'DORA Compliance Evidence Q4 2024',
      description: 'Evidence pack for DORA compliance',
      framework: 'DORA',
      jurisdiction: 'EU',
      status: 'ready' as const,
      regulationId: regulationIds[0],
      intendedAudience: 'auditor',
      exportFormat: 'pdf',
      generatedAt: new Date(),
    },
    {
      organizationId: orgId,
      title: 'GDPR Article 32 Security Measures',
      description: 'Technical security measures documentation',
      framework: 'GDPR',
      jurisdiction: 'EU',
      status: 'draft' as const,
      regulationId: regulationIds[1],
      intendedAudience: 'internal',
      exportFormat: 'json',
      generatedAt: new Date(),
    },
    {
      organizationId: orgId,
      title: 'Incident Response Evidence',
      description: 'DORA incident reporting compliance evidence',
      framework: 'DORA',
      jurisdiction: 'EU',
      status: 'generating' as const,
      regulationId: regulationIds[0],
      intendedAudience: 'regulator',
      exportFormat: 'pdf',
      generatedAt: new Date(),
    },
  ]
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seed() {
  console.log('🌱 Starting database seed...\n')

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log('🗑️  Clearing existing data...')
    await db.delete(auditLog)
    await db.delete(regulatoryChanges)
    await db.delete(evidencePacks)
    await db.delete(alerts)
    await db.delete(obligationSystemMappings)
    await db.delete(articleSystemImpacts)
    await db.delete(obligations)
    await db.delete(articles)
    await db.delete(regulations)
    await db.delete(ingestJobs)
    await db.delete(systems)
    console.log('   ✓ Cleared existing data\n')

    // Seed organizations
    console.log('🏢 Seeding organizations...')
    for (const org of organizationsSeed) {
      const existing = await db.select().from(organization).where(eq(organization.id, org.id))
      if (existing.length === 0) {
        await db.insert(organization).values(org)
      }
    }
    console.log(`   ✓ Ensured ${organizationsSeed.length} organizations\n`)

    // Seed users
    console.log('👤 Seeding users...')
    for (const u of usersSeed) {
      const existing = await db.select().from(user).where(eq(user.id, u.id))
      if (existing.length === 0) {
        await db.insert(user).values(u)
      }
    }
    console.log(`   ✓ Ensured ${usersSeed.length} users\n`)

    // Seed memberships
    console.log('🔗 Seeding memberships...')
    for (const m of membershipsSeed) {
      const existing = await db
        .select()
        .from(member)
        .where(and(eq(member.organizationId, m.organizationId), eq(member.userId, m.userId)))
      if (existing.length === 0) {
        await db.insert(member).values(m)
      }
    }
    console.log(`   ✓ Ensured ${membershipsSeed.length} memberships\n`)

    // Track totals for summary
    let totalRegs = 0
    let totalArts = 0
    let totalObls = 0
    let totalSystems = 0
    let totalAlerts = 0
    let totalEvidencePacks = 0
    let totalMappings = 0

    // Seed per-org data
    for (const orgId of ['finbank-eu', 'paytech-uk'] as const) {
      console.log(`\n📦 Seeding data for ${orgId}...`)

      // Create ingest job for provenance
      const ingestJobId = `${orgId}-seed-job`
      await db.insert(ingestJobs).values({
        id: ingestJobId,
        organizationId: orgId,
        source: 'seed',
        status: 'succeeded',
        startedAt: new Date(),
        finishedAt: new Date(),
      })

      // Seed regulations
      const orgRegs = regulationsPerOrg[orgId]
      for (const reg of orgRegs) {
        await db.insert(regulations).values({
          ...reg,
          organizationId: orgId,
          ingestJobId,
          ingestTimestamp: new Date(),
        })
      }
      totalRegs += orgRegs.length
      console.log(`   ✓ ${orgRegs.length} regulations`)

      // Seed articles and obligations per regulation
      for (const reg of orgRegs) {
        const prefix = reg.id
        const arts = generateArticles(orgId, reg.id, prefix)

        for (const art of arts) {
          await db.insert(articles).values({
            ...art,
            ingestJobId,
            ingestTimestamp: new Date(),
          })
        }
        totalArts += arts.length

        const obls = generateObligations(
          orgId,
          reg.id,
          arts.map((a) => a.id),
          prefix
        )
        for (const obl of obls) {
          await db.insert(obligations).values({
            ...obl,
            ingestJobId,
            ingestTimestamp: new Date(),
          })
        }
        totalObls += obls.length
      }
      console.log(`   ✓ ${totalArts} articles (cumulative)`)
      console.log(`   ✓ ${totalObls} obligations (cumulative)`)

      // Seed systems
      const orgSystems = systemsPerOrg[orgId]
      for (const sys of orgSystems) {
        await db.insert(systems).values({
          ...sys,
          slug: sys.id,
          organizationId: orgId,
          description: `${sys.name} system for ${orgId}`,
        })
      }
      totalSystems += orgSystems.length
      console.log(`   ✓ ${orgSystems.length} systems`)

      // Seed obligation-system mappings
      const allObls = await db.query.obligations.findMany({
        where: eq(obligations.organizationId, orgId),
      })

      let mappingCount = 0
      for (let i = 0; i < allObls.length; i++) {
        // Map ~70% of obligations to systems
        if (Math.random() < 0.7) {
          const sys = orgSystems[i % orgSystems.length]
          await db.insert(obligationSystemMappings).values({
            organizationId: orgId,
            obligationId: allObls[i].id,
            systemId: sys.id,
            mappingConfidence: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
            mappedBy: 'human',
            reason: 'Seeded mapping',
          })
          mappingCount++
        }
      }
      totalMappings += mappingCount
      console.log(`   ✓ ${mappingCount} obligation-system mappings`)

      // Seed alerts
      const regIds = orgRegs.map((r) => r.id)
      const orgAlerts = generateAlerts(orgId, regIds)
      for (const alert of orgAlerts) {
        await db.insert(alerts).values(alert)
      }
      totalAlerts += orgAlerts.length
      console.log(`   ✓ ${orgAlerts.length} alerts`)

      // Seed evidence packs
      const orgPacks = generateEvidencePacks(orgId, regIds)
      for (const pack of orgPacks) {
        await db.insert(evidencePacks).values(pack)
      }
      totalEvidencePacks += orgPacks.length
      console.log(`   ✓ ${orgPacks.length} evidence packs`)

      // Seed article-system impacts
      const orgArts = await db.query.articles.findMany({
        where: eq(articles.organizationId, orgId),
      })

      let impactCount = 0
      for (const art of orgArts) {
        // Create 1-2 impacts per article
        const numImpacts = 1 + Math.floor(Math.random() * 2)
        for (let i = 0; i < numImpacts; i++) {
          const sys = orgSystems[Math.floor(Math.random() * orgSystems.length)]
          await db.insert(articleSystemImpacts).values({
            organizationId: orgId,
            articleId: art.id,
            systemId: sys.id,
            impactLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as
              | 'low'
              | 'medium'
              | 'high'
              | 'critical',
          })
          impactCount++
        }
      }
      console.log(`   ✓ ${impactCount} article-system impacts`)

      // Seed some audit log entries
      await db.insert(auditLog).values({
        organizationId: orgId,
        actorUserId: orgId === 'finbank-eu' ? 'finbank-admin' : 'paytech-admin',
        action: 'create_regulation',
        entityType: 'regulation',
        entityId: regIds[0],
        diff: { before: null, after: { id: regIds[0], status: 'active' } },
      })
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Database seeded successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`
Summary:
  • ${organizationsSeed.length} organizations
  • ${usersSeed.length} users
  • ${membershipsSeed.length} memberships (Day 1 roles)
  • ${totalRegs} regulations
  • ${totalArts} articles
  • ${totalObls} obligations
  • ${totalSystems} systems
  • ${totalMappings} obligation-system mappings
  • ${totalAlerts} alerts
  • ${totalEvidencePacks} evidence packs
`)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

// Run the seed
seed()
  .then(() => {
    console.log('🎉 Seed complete!')

    // Generate seed snapshot
    try {
      const snapshotLines = []
      snapshotLines.push('# Seed Snapshot')
      snapshotLines.push('')
      snapshotLines.push('## Organizations')
      snapshotLines.push('')
      for (const org of organizationsSeed) {
        snapshotLines.push(`- **${org.name}** (${org.id})`)
      }
      snapshotLines.push('')
      snapshotLines.push('## Example Logins')
      snapshotLines.push('')
      snapshotLines.push('| Email | Org | Role |')
      snapshotLines.push('|-------|-----|------|')
      snapshotLines.push('| admin+finbank@cindral.dev | FinBank EU | OrgAdmin |')
      snapshotLines.push('| compliance+finbank@cindral.dev | FinBank EU | ComplianceManager |')
      snapshotLines.push('| auditor+finbank@cindral.dev | FinBank EU | Auditor |')
      snapshotLines.push('| viewer+finbank@cindral.dev | FinBank EU | Viewer |')
      snapshotLines.push('| admin+paytech@cindral.dev | PayTech UK | OrgAdmin |')
      snapshotLines.push('| compliance+paytech@cindral.dev | PayTech UK | ComplianceManager |')
      snapshotLines.push('')
      snapshotLines.push('## Hero Chain Example (FinBank EU)')
      snapshotLines.push('')
      snapshotLines.push('```')
      snapshotLines.push('Regulation: finbank-dora')
      snapshotLines.push('  └── Article: finbank-dora-art-1')
      snapshotLines.push('      └── Obligation: finbank-dora-OBL-001')
      snapshotLines.push('          └── System: finbank-core-banking')
      snapshotLines.push('              └── Alert: finbank-eu-ALT-001')
      snapshotLines.push('```')
      snapshotLines.push('')
      snapshotLines.push('## Role Permissions')
      snapshotLines.push('')
      snapshotLines.push('- **OrgAdmin**: Full access, can delete regulations')
      snapshotLines.push('- **ComplianceManager**: Can mutate compliance data')
      snapshotLines.push('- **Auditor**: Read-only access')
      snapshotLines.push('- **Viewer**: Read-only access')
      snapshotLines.push('- **BillingAdmin**: Billing management')

      const outPath = path.join(process.cwd(), 'scripts', 'seed-snapshot.md')
      fs.writeFileSync(outPath, snapshotLines.join('\n'))
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
