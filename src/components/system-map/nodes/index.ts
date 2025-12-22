export { ArticleNode } from './article-node'
export { RegulationNode } from './regulation-node'
export { SystemNode } from './system-node'

import { ArticleNode } from './article-node'
import { RegulationNode } from './regulation-node'
import { SystemNode } from './system-node'

export const nodeTypes = {
  regulation: RegulationNode,
  article: ArticleNode,
  system: SystemNode,
}
