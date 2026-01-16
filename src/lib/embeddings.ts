/**
 * Vector Embeddings Service
 *
 * Foundation for semantic search and RAG capabilities.
 * Supports regulatory text chunking, embedding generation, and similarity search.
 */

import { logger } from './logger'

// Types
export interface TextChunk {
  id: string
  content: string
  metadata: {
    sourceType: 'regulation' | 'article' | 'obligation' | 'system'
    sourceId: string
    organizationId?: string
    regulationId?: string
    articleNumber?: string
    sectionTitle?: string
    chunkIndex: number
    totalChunks: number
  }
}

export interface EmbeddingResult {
  chunkId: string
  embedding: number[]
  model: string
  dimensions: number
}

export interface SimilarityResult {
  chunk: TextChunk
  score: number
  embedding?: number[]
}

export interface EmbeddingConfig {
  model: 'text-embedding-3-small' | 'text-embedding-3-large' | 'text-embedding-ada-002'
  dimensions?: number
  batchSize?: number
}

// Default configuration
const DEFAULT_CONFIG: EmbeddingConfig = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  batchSize: 100,
}

// In-memory vector store (production: use pgvector, Pinecone, or Qdrant)
const vectorStore = new Map<string, { chunk: TextChunk; embedding: number[] }>()

/**
 * Chunk text into smaller pieces for embedding
 * Uses sentence-aware splitting to maintain context
 */
export function chunkText(
  text: string,
  options: {
    maxChunkSize?: number
    overlapSize?: number
    preserveSentences?: boolean
  } = {}
): string[] {
  const { maxChunkSize = 512, overlapSize = 50, preserveSentences = true } = options

  if (!text || text.length <= maxChunkSize) {
    return text ? [text.trim()] : []
  }

  const chunks: string[] = []

  if (preserveSentences) {
    // Split by sentences first
    const sentences = text.split(/(?<=[.!?])\s+/)
    let currentChunk = ''

    for (const sentence of sentences) {
      if ((currentChunk + ' ' + sentence).length <= maxChunkSize) {
        currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim())
        }
        // Handle sentences longer than maxChunkSize
        if (sentence.length > maxChunkSize) {
          const words = sentence.split(/\s+/)
          let wordChunk = ''
          for (const word of words) {
            if ((wordChunk + ' ' + word).length <= maxChunkSize) {
              wordChunk = wordChunk ? wordChunk + ' ' + word : word
            } else {
              if (wordChunk) chunks.push(wordChunk.trim())
              wordChunk = word
            }
          }
          currentChunk = wordChunk
        } else {
          currentChunk = sentence
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim())
    }
  } else {
    // Simple character-based chunking with overlap
    for (let i = 0; i < text.length; i += maxChunkSize - overlapSize) {
      chunks.push(text.slice(i, i + maxChunkSize).trim())
    }
  }

  return chunks.filter((c) => c.length > 0)
}

/**
 * Create text chunks with metadata for a regulation article
 */
export function createArticleChunks(
  articleId: string,
  articleContent: string,
  metadata: {
    organizationId?: string
    regulationId: string
    articleNumber: string
    sectionTitle?: string
  }
): TextChunk[] {
  const textChunks = chunkText(articleContent, {
    maxChunkSize: 512,
    overlapSize: 50,
    preserveSentences: true,
  })

  return textChunks.map((content, index) => ({
    id: `${articleId}-chunk-${index}`,
    content,
    metadata: {
      sourceType: 'article' as const,
      sourceId: articleId,
      organizationId: metadata.organizationId,
      regulationId: metadata.regulationId,
      articleNumber: metadata.articleNumber,
      sectionTitle: metadata.sectionTitle,
      chunkIndex: index,
      totalChunks: textChunks.length,
    },
  }))
}

/**
 * Generate embeddings for text chunks
 * Uses OpenAI's embedding API
 */
export async function generateEmbeddings(
  chunks: TextChunk[],
  config: Partial<EmbeddingConfig> = {}
): Promise<EmbeddingResult[]> {
  const { model, dimensions, batchSize } = { ...DEFAULT_CONFIG, ...config }

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    logger.warn('OpenAI API key not configured, using mock embeddings')
    // Return mock embeddings for development
    return chunks.map((chunk) => ({
      chunkId: chunk.id,
      embedding: generateMockEmbedding(dimensions ?? 1536),
      model,
      dimensions: dimensions ?? 1536,
    }))
  }

  const results: EmbeddingResult[] = []

  // Process in batches
  for (let i = 0; i < chunks.length; i += batchSize ?? 100) {
    const batch = chunks.slice(i, i + (batchSize ?? 100))
    const texts = batch.map((c) => c.content)

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: texts,
          dimensions,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenAI API error: ${error}`)
      }

      const data = (await response.json()) as {
        data: Array<{ embedding: number[]; index: number }>
        model: string
        usage: { prompt_tokens: number; total_tokens: number }
      }

      for (const item of data.data) {
        results.push({
          chunkId: batch[item.index].id,
          embedding: item.embedding,
          model: data.model,
          dimensions: item.embedding.length,
        })
      }

      logger.debug('Generated embeddings batch', {
        batchIndex: Math.floor(i / (batchSize ?? 100)),
        batchSize: batch.length,
        tokensUsed: data.usage.total_tokens,
      })
    } catch (error) {
      logger.error('Failed to generate embeddings', {
        error: error instanceof Error ? error.message : 'Unknown error',
        batchIndex: Math.floor(i / (batchSize ?? 100)),
      })
      throw error
    }
  }

  return results
}

/**
 * Generate mock embedding for development/testing
 */
function generateMockEmbedding(dimensions: number): number[] {
  // Generate deterministic-ish mock embedding
  const embedding: number[] = []
  for (let i = 0; i < dimensions; i++) {
    embedding.push(Math.sin(i * 0.01) * 0.5 + (Math.random() - 0.5) * 0.1)
  }
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return embedding.map((val) => val / magnitude)
}

/**
 * Store chunks with their embeddings in the vector store
 */
export async function storeEmbeddings(chunks: TextChunk[], embeddings: EmbeddingResult[]): Promise<number> {
  const embeddingMap = new Map(embeddings.map((e) => [e.chunkId, e.embedding]))

  let stored = 0
  for (const chunk of chunks) {
    const embedding = embeddingMap.get(chunk.id)
    if (embedding) {
      vectorStore.set(chunk.id, { chunk, embedding })
      stored++
    }
  }

  logger.info('Stored embeddings', { count: stored, totalInStore: vectorStore.size })
  return stored
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions')
  }

  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    magnitudeA += a[i] * a[i]
    magnitudeB += b[i] * b[i]
  }

  magnitudeA = Math.sqrt(magnitudeA)
  magnitudeB = Math.sqrt(magnitudeB)

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Search for similar chunks using vector similarity
 */
export async function searchSimilar(
  query: string,
  options: {
    topK?: number
    minScore?: number
    filterOrganizationId?: string
    filterRegulationId?: string
    filterSourceType?: TextChunk['metadata']['sourceType']
  } = {}
): Promise<SimilarityResult[]> {
  const { topK = 5, minScore = 0.7, filterOrganizationId, filterRegulationId, filterSourceType } = options

  // Generate embedding for query
  const queryChunk: TextChunk = {
    id: 'query',
    content: query,
    metadata: {
      sourceType: 'regulation',
      sourceId: 'query',
      chunkIndex: 0,
      totalChunks: 1,
    },
  }

  const [queryEmbedding] = await generateEmbeddings([queryChunk])

  // Search vector store
  const results: SimilarityResult[] = []

  for (const { chunk, embedding } of vectorStore.values()) {
    // Apply filters
    if (filterOrganizationId && chunk.metadata.organizationId !== filterOrganizationId) {
      continue
    }
    if (filterRegulationId && chunk.metadata.regulationId !== filterRegulationId) {
      continue
    }
    if (filterSourceType && chunk.metadata.sourceType !== filterSourceType) {
      continue
    }

    const score = cosineSimilarity(queryEmbedding.embedding, embedding)

    if (score >= minScore) {
      results.push({ chunk, score, embedding })
    }
  }

  // Sort by score and return top K
  return results.sort((a, b) => b.score - a.score).slice(0, topK)
}

/**
 * Index regulatory content for semantic search
 * Call this when regulations/articles are ingested or updated
 */
export async function indexRegulationContent(
  regulationId: string,
  articles: Array<{
    id: string
    articleNumber: string
    content: string
    sectionTitle?: string
  }>,
  organizationId?: string
): Promise<{ chunksCreated: number; embeddingsGenerated: number }> {
  const allChunks: TextChunk[] = []

  for (const article of articles) {
    const chunks = createArticleChunks(article.id, article.content, {
      organizationId,
      regulationId,
      articleNumber: article.articleNumber,
      sectionTitle: article.sectionTitle,
    })
    allChunks.push(...chunks)
  }

  const embeddings = await generateEmbeddings(allChunks)
  await storeEmbeddings(allChunks, embeddings)

  logger.info('Indexed regulation content', {
    regulationId,
    articlesCount: articles.length,
    chunksCreated: allChunks.length,
    embeddingsGenerated: embeddings.length,
  })

  return {
    chunksCreated: allChunks.length,
    embeddingsGenerated: embeddings.length,
  }
}

/**
 * Get vector store statistics
 */
export function getVectorStoreStats(): {
  totalChunks: number
  bySourceType: Record<string, number>
  byRegulation: Record<string, number>
} {
  const bySourceType: Record<string, number> = {}
  const byRegulation: Record<string, number> = {}

  for (const { chunk } of vectorStore.values()) {
    const sourceType = chunk.metadata.sourceType
    bySourceType[sourceType] = (bySourceType[sourceType] ?? 0) + 1

    const regId = chunk.metadata.regulationId ?? 'unknown'
    byRegulation[regId] = (byRegulation[regId] ?? 0) + 1
  }

  return {
    totalChunks: vectorStore.size,
    bySourceType,
    byRegulation,
  }
}

/**
 * Clear vector store (for testing)
 */
export function clearVectorStore(): number {
  const size = vectorStore.size
  vectorStore.clear()
  return size
}
