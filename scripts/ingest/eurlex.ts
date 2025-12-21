/**
 * EUR-Lex HTML Fetcher and Parser
 *
 * Fetches regulatory text from EUR-Lex and extracts articles
 */

import * as cheerio from 'cheerio'

import type { RawArticle, RawRegulation } from './types'
import { EUR_LEX_SOURCES, type EurLexRegulationKey } from './types'

/**
 * Fetch HTML content from EUR-Lex
 */
async function fetchEurLexHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Cindral Regulatory Compliance Platform (https://trycindral.com)',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch EUR-Lex: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

/**
 * Clean text content by removing excessive whitespace
 */
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Parse EUR-Lex HTML to extract articles
 *
 * EUR-Lex HTML structure varies by document, but typically:
 * - Articles are in divs with class containing "eli-subdivision"
 * - Article titles contain "Article X"
 * - Content follows in subsequent paragraphs
 */
function parseEurLexArticles(html: string, regulationId: string): RawArticle[] {
  const $ = cheerio.load(html)
  const articles: RawArticle[] = []

  // Track current section for context
  let currentSection = ''

  // EUR-Lex uses various structures. We'll look for common patterns.
  // Pattern 1: Look for article headings (most common)
  const articlePattern = /^Article\s+(\d+[a-z]?)$/i
  const articleWithParaPattern = /^Article\s+(\d+[a-z]?)\s*\((\d+)\)$/i

  // Find all potential article containers
  // EUR-Lex typically uses .eli-subdivision or specific class patterns
  $('p, div').each((_index, element) => {
    const $el = $(element)
    const text = cleanText($el.text())

    // Check for chapter/section headings to track context
    if (text.match(/^(Chapter|Section|CHAPTER|SECTION)\s+[IVX\d]+/i)) {
      // Look for the title in the next sibling or within
      const titleEl = $el.next()
      if (titleEl.length) {
        currentSection = cleanText(titleEl.text())
      }
    }

    // Check if this is an article title
    const articleMatch = text.match(articlePattern)
    if (articleMatch) {
      const articleNum = articleMatch[1]
      const articleId = `${regulationId}-article-${articleNum.toLowerCase()}`

      // Collect content from following siblings until next article
      const contentParts: string[] = []
      let $current = $el.next()

      while ($current.length) {
        const currentText = cleanText($current.text())

        // Stop if we hit another article
        if (currentText.match(articlePattern)) {
          break
        }

        // Skip empty content
        if (currentText.length > 0) {
          contentParts.push(currentText)
        }

        $current = $current.next()

        // Safety limit to prevent infinite loops
        if (contentParts.length > 100) break
      }

      if (contentParts.length > 0) {
        articles.push({
          id: articleId,
          regulationId,
          articleNumber: `Article ${articleNum}`,
          sectionTitle: currentSection || undefined,
          fullText: contentParts.join('\n\n'),
        })
      }
    }
  })

  // If no articles found with Pattern 1, try Pattern 2 (structured divs)
  if (articles.length === 0) {
    // Look for .eli-subdivision or similar containers
    $('[class*="article"], .eli-subdivision').each((_index, element) => {
      const $el = $(element)
      const text = cleanText($el.text())

      // Try to extract article number from the beginning
      const match = text.match(/Article\s+(\d+[a-z]?)/i)
      if (match) {
        const articleNum = match[1]
        const articleId = `${regulationId}-article-${articleNum.toLowerCase()}`

        // Skip if already captured
        if (articles.some((a) => a.id === articleId)) return

        articles.push({
          id: articleId,
          regulationId,
          articleNumber: `Article ${articleNum}`,
          fullText: text,
        })
      }
    })
  }

  return articles
}

/**
 * Fetch and parse a regulation from EUR-Lex
 */
export async function fetchRegulation(key: EurLexRegulationKey): Promise<{
  regulation: RawRegulation
  articles: RawArticle[]
}> {
  const source = EUR_LEX_SOURCES[key]

  console.log(`📥 Fetching ${source.name} from EUR-Lex...`)
  const html = await fetchEurLexHtml(source.sourceUrl)

  console.log(`📄 Parsing articles...`)
  const articles = parseEurLexArticles(html, source.id)

  console.log(`✅ Found ${articles.length} articles in ${source.name}`)

  return {
    regulation: {
      id: source.id,
      name: source.name,
      fullTitle: source.fullTitle,
      jurisdiction: source.jurisdiction,
      effectiveDate: source.effectiveDate,
      sourceUrl: source.sourceUrl,
      celexNumber: source.celexNumber,
    },
    articles,
  }
}

/**
 * List available EUR-Lex regulations
 */
export function listAvailableRegulations(): {
  key: EurLexRegulationKey
  name: string
  fullTitle: string
}[] {
  return Object.entries(EUR_LEX_SOURCES).map(([key, value]) => ({
    key: key as EurLexRegulationKey,
    name: value.name,
    fullTitle: value.fullTitle,
  }))
}
