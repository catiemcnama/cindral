#!/usr/bin/env tsx
/**
 * Regulatory Data Ingestion Pipeline
 *
 * Fetches regulations from EUR-Lex, enriches with AI summaries,
 * and stores in PostgreSQL database.
 *
 * Usage:
 *   npx dotenv -e .env.local -- tsx scripts/ingest/main.ts [regulation]
 *
 * Examples:
 *   npx dotenv -e .env.local -- tsx scripts/ingest/main.ts dora
 *   npx dotenv -e .env.local -- tsx scripts/ingest/main.ts --all
 *   npx dotenv -e .env.local -- tsx scripts/ingest/main.ts --list
 */

import { calculateCost, processArticlesBatch } from './claude'
import { batchUpsertArticles, getDatabaseSummary, upsertRegulation } from './database'
import { fetchRegulation, listAvailableRegulations } from './eurlex'

import type { EurLexRegulationKey, IngestionStats } from './types'
import { EUR_LEX_SOURCES } from './types'

/**
 * Progress bar helper
 */
function progressBar(current: number, total: number, width = 30): string {
  const percent = Math.round((current / total) * 100)
  const filled = Math.round((current / total) * width)
  const empty = width - filled
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percent}% (${current}/${total})`
}

/**
 * Ingest a single regulation
 */
async function ingestRegulation(key: EurLexRegulationKey): Promise<IngestionStats> {
  const startTime = Date.now()

  console.log('\n' + '='.repeat(60))
  console.log(`🚀 Starting ingestion for: ${EUR_LEX_SOURCES[key].name}`)
  console.log('='.repeat(60))

  // Step 1: Fetch from EUR-Lex
  const { regulation, articles } = await fetchRegulation(key)

  if (articles.length === 0) {
    console.log('⚠️  No articles found. The HTML structure may have changed.')
    return {
      regulationId: regulation.id,
      articlesFound: 0,
      articlesProcessed: 0,
      articlesFailed: 0,
      obligationsGenerated: 0,
      tokensUsed: { inputTokens: 0, outputTokens: 0 },
      estimatedCost: 0,
      durationMs: Date.now() - startTime,
    }
  }

  // Step 2: Save regulation to database
  await upsertRegulation(regulation)

  // Step 3: Process articles with Claude
  console.log(`\n🤖 Analyzing ${articles.length} articles with Claude...`)

  const { enriched, failed, totalUsage } = await processArticlesBatch(articles, regulation.name, {
    concurrency: 3,
    delayMs: 300,
    onProgress: (completed, total) => {
      process.stdout.write(`\r   ${progressBar(completed, total)}`)
    },
  })
  console.log() // New line after progress bar

  if (failed.length > 0) {
    console.log(`\n⚠️  ${failed.length} articles failed to process:`)
    failed.slice(0, 5).forEach((f) => {
      console.log(`   - ${f.article.articleNumber}: ${f.error}`)
    })
    if (failed.length > 5) {
      console.log(`   ... and ${failed.length - 5} more`)
    }
  }

  // Step 4: Save enriched articles to database
  console.log(`\n💾 Saving to database...`)
  const dbResult = await batchUpsertArticles(enriched, (completed, total) => {
    process.stdout.write(`\r   ${progressBar(completed, total)}`)
  })
  console.log()

  // Step 5: Calculate costs
  const estimatedCost = calculateCost(totalUsage.inputTokens, totalUsage.outputTokens)

  // Count obligations
  const totalObligations = enriched.reduce((sum, a) => sum + a.obligations.length, 0)

  const stats: IngestionStats = {
    regulationId: regulation.id,
    articlesFound: articles.length,
    articlesProcessed: enriched.length,
    articlesFailed: failed.length,
    obligationsGenerated: totalObligations,
    tokensUsed: totalUsage,
    estimatedCost,
    durationMs: Date.now() - startTime,
  }

  // Print summary
  console.log('\n' + '-'.repeat(40))
  console.log(`📊 Ingestion Complete: ${regulation.name}`)
  console.log('-'.repeat(40))
  console.log(`   Articles found:     ${stats.articlesFound}`)
  console.log(`   Articles processed: ${stats.articlesProcessed}`)
  console.log(`   Articles failed:    ${stats.articlesFailed}`)
  console.log(`   Obligations:        ${stats.obligationsGenerated}`)
  console.log(`   DB inserts:         ${dbResult.articlesInserted} new, ${dbResult.articlesUpdated} updated`)
  console.log(
    `   Tokens used:        ${stats.tokensUsed.inputTokens.toLocaleString()} in / ${stats.tokensUsed.outputTokens.toLocaleString()} out`
  )
  console.log(`   Estimated cost:     $${stats.estimatedCost.toFixed(4)}`)
  console.log(`   Duration:           ${(stats.durationMs / 1000).toFixed(1)}s`)

  return stats
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2)

  // Show help
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Cindral Regulatory Ingestion Pipeline

Usage:
  npx dotenv -e .env.local -- tsx scripts/ingest/main.ts <command>

Commands:
  dora, gdpr, ai-act, mica, nis2, psd2   Ingest specific regulation
  --all                                   Ingest all regulations
  --list                                  List available regulations
  --status                                Show database status
  --help                                  Show this help message

Examples:
  npx dotenv -e .env.local -- tsx scripts/ingest/main.ts dora
  npx dotenv -e .env.local -- tsx scripts/ingest/main.ts --all
`)
    return
  }

  // List available regulations
  if (args.includes('--list')) {
    console.log('\n📋 Available EUR-Lex Regulations:\n')
    listAvailableRegulations().forEach((r) => {
      console.log(`   ${r.key.padEnd(10)} ${r.name.padEnd(10)} ${r.fullTitle}`)
    })
    console.log()
    return
  }

  // Show database status
  if (args.includes('--status')) {
    console.log('\n📊 Database Status:\n')
    const summary = await getDatabaseSummary()
    console.log(`   Regulations:  ${summary.regulations}`)
    console.log(`   Articles:     ${summary.articles}`)
    console.log(`   Obligations:  ${summary.obligations}`)
    console.log()
    return
  }

  // Ingest all regulations
  if (args.includes('--all')) {
    console.log('\n🌍 Ingesting ALL EUR-Lex regulations...\n')
    const keys = Object.keys(EUR_LEX_SOURCES) as EurLexRegulationKey[]
    const allStats: IngestionStats[] = []

    for (const key of keys) {
      const stats = await ingestRegulation(key)
      allStats.push(stats)
    }

    // Print grand total
    const totalCost = allStats.reduce((sum, s) => sum + s.estimatedCost, 0)
    const totalArticles = allStats.reduce((sum, s) => sum + s.articlesProcessed, 0)
    const totalObligations = allStats.reduce((sum, s) => sum + s.obligationsGenerated, 0)

    console.log('\n' + '='.repeat(60))
    console.log('🎉 ALL INGESTION COMPLETE')
    console.log('='.repeat(60))
    console.log(`   Total regulations: ${allStats.length}`)
    console.log(`   Total articles:    ${totalArticles}`)
    console.log(`   Total obligations: ${totalObligations}`)
    console.log(`   Total cost:        $${totalCost.toFixed(4)}`)
    return
  }

  // Ingest specific regulation
  const regKey = args[0].toLowerCase().replace('-', '') as EurLexRegulationKey

  // Handle kebab-case to camelCase conversion
  const keyMap: Record<string, EurLexRegulationKey> = {
    dora: 'dora',
    gdpr: 'gdpr',
    'ai-act': 'aiAct',
    aiact: 'aiAct',
    mica: 'mica',
    nis2: 'nis2',
    psd2: 'psd2',
  }

  const normalizedKey = keyMap[args[0].toLowerCase()]

  if (!normalizedKey || !EUR_LEX_SOURCES[normalizedKey]) {
    console.error(`❌ Unknown regulation: ${args[0]}`)
    console.error(`   Available: ${Object.keys(keyMap).join(', ')}`)
    process.exit(1)
  }

  await ingestRegulation(normalizedKey)
}

// Run
main().catch((error) => {
  console.error('\n❌ Ingestion failed:', error)
  process.exit(1)
})
