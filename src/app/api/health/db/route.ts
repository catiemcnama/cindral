import { db } from '@/db'
import {
  alerts,
  articles,
  evidencePacks,
  ingestJobs,
  obligations,
  organization,
  regulations,
  systems,
} from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test DB connectivity
    await db.select().from(regulations).limit(1)

    const orgs = await db.select().from(organization)

    const results = []
    for (const org of orgs) {
      const [regs, arts, obls, syss, packs, alts, lastIngest] = await Promise.all([
        db.query.regulations.findMany({ where: eq(regulations.organizationId, org.id) }),
        db.query.articles.findMany({ where: eq(articles.organizationId, org.id) }),
        db.query.obligations.findMany({ where: eq(obligations.organizationId, org.id) }),
        db.query.systems.findMany({ where: eq(systems.organizationId, org.id) }),
        db.query.evidencePacks.findMany({ where: eq(evidencePacks.organizationId, org.id) }),
        db.query.alerts.findMany({ where: eq(alerts.organizationId, org.id) }),
        db.query.ingestJobs.findFirst({
          where: eq(ingestJobs.organizationId, org.id),
          orderBy: (j, { desc }) => desc(j.startedAt),
        }),
      ])

      results.push({
        organizationId: org.id,
        organizationName: org.name,
        counts: {
          regulations: regs.length,
          articles: arts.length,
          obligations: obls.length,
          systems: syss.length,
          evidencePacks: packs.length,
          alerts: alts.length,
        },
        lastIngest: lastIngest ? lastIngest.startedAt : null,
      })
    }

    return NextResponse.json({ ok: true, data: results })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
