/**
 * Claude API Integration for Regulatory Text Processing
 *
 * Uses Claude 3.5 Haiku for cost-effective bulk processing
 */

import Anthropic from '@anthropic-ai/sdk'

import type { EnrichedArticle, RawArticle } from './types'

// Haiku pricing (as of Dec 2024)
const HAIKU_INPUT_COST_PER_MILLION = 0.25
const HAIKU_OUTPUT_COST_PER_MILLION = 1.25

let anthropicClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

/**
 * System prompt for regulatory article analysis
 */
const SYSTEM_PROMPT = `You are an expert regulatory compliance analyst specializing in financial regulations, data protection, and AI governance. Your task is to analyze regulatory articles and provide:

1. A plain English summary (2-3 sentences) that a non-lawyer can understand
2. Risk level assessment (critical/high/medium/low) based on:
   - Critical: Direct requirements with severe penalties, tight deadlines, or fundamental obligations
   - High: Significant compliance burden, notable penalties, specific technical requirements
   - Medium: Standard compliance requirements, moderate complexity
   - Low: Informational, definitional, or minor procedural requirements
3. Specific compliance obligations that organizations must fulfill
4. System types this regulation primarily applies to (e.g., "Core Banking", "Payment Systems", "Customer Data", "AI/ML Systems", "Cloud Infrastructure")

Respond in valid JSON format only.`

/**
 * Analyze a single article with Claude
 */
export async function analyzeArticle(
  article: RawArticle,
  regulationName: string
): Promise<{
  enriched: EnrichedArticle
  usage: { inputTokens: number; outputTokens: number }
}> {
  const client = getClient()

  const userPrompt = `Analyze this article from ${regulationName}:

Article Number: ${article.articleNumber}
${article.sectionTitle ? `Section: ${article.sectionTitle}` : ''}

Full Text:
${article.fullText}

Respond with JSON in this exact format:
{
  "summary": "Plain English summary here",
  "riskLevel": "critical|high|medium|low",
  "obligations": [
    {"title": "Short obligation title", "description": "Detailed description of what must be done"}
  ],
  "systemTypes": ["System Type 1", "System Type 2"]
}`

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  // Extract text content
  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  // Parse JSON response
  let parsed: {
    summary: string
    riskLevel: 'critical' | 'high' | 'medium' | 'low'
    obligations: { title: string; description: string }[]
    systemTypes: string[]
  }

  try {
    // Handle potential markdown code blocks
    let jsonText = textContent.text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7)
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3)
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3)
    }
    parsed = JSON.parse(jsonText.trim())
  } catch {
    console.error('Failed to parse Claude response:', textContent.text)
    throw new Error('Failed to parse Claude JSON response')
  }

  return {
    enriched: {
      ...article,
      aiSummary: parsed.summary,
      riskLevel: parsed.riskLevel,
      obligations: parsed.obligations,
      systemTypes: parsed.systemTypes,
    },
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  }
}

/**
 * Calculate estimated cost from token usage
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * HAIKU_INPUT_COST_PER_MILLION
  const outputCost = (outputTokens / 1_000_000) * HAIKU_OUTPUT_COST_PER_MILLION
  return inputCost + outputCost
}

/**
 * Process multiple articles with rate limiting
 */
export async function processArticlesBatch(
  articles: RawArticle[],
  regulationName: string,
  options: {
    concurrency?: number
    delayMs?: number
    onProgress?: (completed: number, total: number) => void
  } = {}
): Promise<{
  enriched: EnrichedArticle[]
  failed: { article: RawArticle; error: string }[]
  totalUsage: { inputTokens: number; outputTokens: number }
}> {
  const { concurrency = 3, delayMs = 200, onProgress } = options

  const enriched: EnrichedArticle[] = []
  const failed: { article: RawArticle; error: string }[] = []
  let totalInputTokens = 0
  let totalOutputTokens = 0

  // Process in chunks to respect rate limits
  for (let i = 0; i < articles.length; i += concurrency) {
    const chunk = articles.slice(i, i + concurrency)

    const results = await Promise.allSettled(chunk.map((article) => analyzeArticle(article, regulationName)))

    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      const article = chunk[j]

      if (result.status === 'fulfilled') {
        enriched.push(result.value.enriched)
        totalInputTokens += result.value.usage.inputTokens
        totalOutputTokens += result.value.usage.outputTokens
      } else {
        failed.push({
          article,
          error: result.reason?.message || 'Unknown error',
        })
      }
    }

    if (onProgress) {
      onProgress(Math.min(i + concurrency, articles.length), articles.length)
    }

    // Rate limiting delay between chunks
    if (i + concurrency < articles.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return {
    enriched,
    failed,
    totalUsage: {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
    },
  }
}
