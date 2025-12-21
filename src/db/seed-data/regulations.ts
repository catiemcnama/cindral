/**
 * Realistic Regulation Seed Data
 * Contains actual excerpts from DORA and GDPR
 */

export interface RegulationSeed {
  id: string
  slug: string
  framework: string
  version: string
  name: string
  fullTitle: string
  jurisdiction: string
  effectiveDate: Date
  status: 'active' | 'superseded' | 'draft'
  sourceType: 'eur-lex' | 'manual-upload' | 'api' | 'llm' | 'manual'
  sourceUrl?: string
}

export const REGULATIONS: Record<string, RegulationSeed[]> = {
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
      status: 'active',
      sourceType: 'eur-lex',
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R2554',
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
      status: 'active',
      sourceType: 'eur-lex',
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679',
    },
    {
      id: 'finbank-psd2',
      slug: 'psd2',
      framework: 'PSD2',
      version: '1.0',
      name: 'PSD2',
      fullTitle: 'Payment Services Directive 2 (EU) 2015/2366',
      jurisdiction: 'European Union',
      effectiveDate: new Date('2018-01-13'),
      status: 'active',
      sourceType: 'eur-lex',
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32015L2366',
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
      status: 'active',
      sourceType: 'eur-lex',
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R2554',
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
      status: 'active',
      sourceType: 'eur-lex',
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679',
    },
  ],
}
