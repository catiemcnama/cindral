/**
 * Regulation Data for Onboarding
 */

import type { Regulation } from './types'

export const REGULATIONS: Regulation[] = [
  {
    id: 'dora',
    name: 'DORA',
    fullTitle: 'Digital Operational Resilience Act (EU) 2022/2554',
    jurisdiction: 'European Union',
    articleCount: 64,
    obligationCount: 198,
    focus: ['ICT risk', 'Incident reporting', 'Third-party risk'],
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    fullTitle: 'General Data Protection Regulation (EU) 2016/679',
    jurisdiction: 'European Union',
    articleCount: 99,
    obligationCount: 173,
    focus: ['Data protection', 'Privacy rights', 'Lawful processing'],
  },
  {
    id: 'ai-act',
    name: 'AI Act',
    fullTitle: 'Artificial Intelligence Act (EU) 2024/1689',
    jurisdiction: 'European Union',
    articleCount: 113,
    obligationCount: 142,
    focus: ['Risk management', 'Transparency', 'Model governance'],
  },
  {
    id: 'basel-iii',
    name: 'Basel III',
    fullTitle: 'Basel III: International Regulatory Framework for Banks',
    jurisdiction: 'International',
    articleCount: 42,
    obligationCount: 88,
    focus: ['Capital adequacy', 'Liquidity', 'Stress testing'],
  },
  {
    id: 'nis2',
    name: 'NIS2',
    fullTitle: 'Network and Information Security Directive 2 (EU) 2022/2555',
    jurisdiction: 'European Union',
    articleCount: 46,
    obligationCount: 96,
    focus: ['Cybersecurity', 'Supply chain', 'Reporting timelines'],
  },
]

/**
 * Index regulations by ID for quick lookup
 */
export const REGULATION_INDEX = REGULATIONS.reduce<Record<string, Regulation>>((acc, regulation) => {
  acc[regulation.id] = regulation
  return acc
}, {})
