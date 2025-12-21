# Cindral Product Roadmap

> **Last Updated:** December 20, 2025  
> **Status:** Active Development  
> **Current Phase:** Dashboard - Live Data (Workstream 3)
> **Goal:** Production-ready regulatory compliance platform

---

## 🎯 What We're Building

**Cindral** is a regulatory compliance intelligence platform that:

- Monitors regulations (DORA, GDPR, AI Act, Basel III)
- Maps regulations to IT systems
- Generates audit-ready evidence packs
- Alerts compliance teams to regulatory changes

**Why customers pay:** Fear of fines (DORA = up to €10M or 5% revenue), audit stress, compliance team burnout, lack of visibility across systems.

---

## 📊 Current State

| Area            | Status                                                 |
| --------------- | ------------------------------------------------------ |
| Marketing Site  | ✅ Live at trycindral.com                              |
| Screenshots     | ✅ Real product images                                 |
| Tech Stack      | ✅ Next.js 16, tRPC, Better Auth, Drizzle, PostgreSQL  |
| Database Schema | ✅ Full schema defined                                 |
| Database Seed   | ✅ Real DORA data ingested from EUR-Lex                |
| tRPC API Layer  | ✅ 7 routers with 40+ endpoints                        |
| Dashboard UI    | ⏳ Static mockups - connecting to live data next       |
| Authentication  | ✅ Sign in/up pages (needs testing)                    |
| Regulation Data | ✅ DORA fully ingested, pipeline live (others pending) |

---

## 🗄️ DATA STRATEGY: Regulatory Intelligence Platform

> **Core Value Prop:** Cindral IS the regulatory database. Users don't upload PDFs - we cover EVERY regulation.

### The Model

Users sign up → Select industry/jurisdiction → Instantly see ALL applicable regulations → Get alerts on changes → Never touch a PDF.

### Master Regulation Database (Maintained by Cindral)

| Regulation | Jurisdiction | Articles     | Priority | Status                         |
| ---------- | ------------ | ------------ | -------- | ------------------------------ |
| DORA       | EU           | 64           | 🔴 HIGH  | ✅ Ingested from EUR-Lex       |
| GDPR       | EU/Global    | 99           | 🔴 HIGH  | ⏳ Need full text from EUR-Lex |
| AI Act     | EU           | 85           | 🔴 HIGH  | ⏳ Need full text from EUR-Lex |
| MiCA       | EU           | 149          | 🟡 MED   | ⏳ To add                      |
| NIS2       | EU           | 46           | 🟡 MED   | ⏳ To add                      |
| Basel III  | Global       | ~1000 pages  | 🟡 MED   | ⏳ To add                      |
| PSD2/PSD3  | EU           | 117          | 🟡 MED   | ⏳ To add                      |
| eIDAS 2.0  | EU           | 55           | 🟢 LOW   | ⏳ To add                      |
| FCA Rules  | UK           | 1000s        | 🟡 MED   | ⏳ To add                      |
| SOX        | US           | 11 titles    | 🟢 LOW   | ⏳ To add                      |
| CCPA/CPRA  | US-CA        | 30+ sections | 🟢 LOW   | ⏳ To add                      |
| HIPAA      | US           | 5 titles     | 🟢 LOW   | ⏳ To add                      |

### Data Sources (Tier System)

**Tier 1: Official Sources (FREE, Authoritative)**

- EUR-Lex (EU regulations) - DORA, GDPR, AI Act, MiCA, NIS2, PSD2
- BIS (Basel Committee) - Basel III/IV
- FCA Handbook (UK)
- US Federal Register (SOX, HIPAA)

**Tier 2: AI-Powered Extraction**

- Parse regulation PDFs from official sources
- GPT-4/Claude for structuring and summarizing
- Human compliance expert review before publishing

**Tier 3: Premium Data Partners (PAID, for scale)**

- Thomson Reuters Regulatory Intelligence
- Wolters Kluwer
- CUBE
- Corlytics

### Ingestion Pipeline

```
EUR-Lex/BIS → PDF/HTML Download → AI Parsing → Human Review → Database → User Dashboard
                                       ↓
                              Change Detection (RSS/Polling)
                                       ↓
                              Push Alerts to Users
```

### Data Quality Requirements

| Dimension      | Requirement                                 |
| -------------- | ------------------------------------------- |
| Accuracy       | Matches official regulation text exactly    |
| Completeness   | All articles, not just highlights           |
| Currency       | Updated within 24-48 hours of changes       |
| Provenance     | Link back to official source                |
| Interpretation | Plain English summary + risk classification |
| Actionability  | Mapped to specific controls/systems         |

### Onboarding Flow (Industry/Jurisdiction Filtering)

```
Step 1: What's your industry?
→ Banking & Finance, Insurance, Payment Services, Healthcare, Technology, Crypto/DeFi

Step 2: Where do you operate?
→ European Union, United Kingdom, United States, Switzerland, Singapore, Global

Step 3: What systems do you have?
→ Core Banking, Payment Processing, Customer Data, Cloud Infrastructure, Mobile Apps, AI/ML Systems

Result: "Based on your profile, 12 regulations and 847 obligations apply to you"
```

### Phased Implementation

**Phase 1: MVP (Week 1)**

- [ ] Build EUR-Lex ingestion script for DORA, GDPR, AI Act
- [ ] Use Claude/GPT-4 to structure articles with summaries
- [ ] Human review layer for accuracy
- [ ] Replace demo seed data with real content

**Phase 2: Beta (Weeks 2-4)**

- [ ] Add MiCA, NIS2, PSD2
- [ ] Build change detection pipeline (EUR-Lex RSS)
- [ ] Automated alerts on regulatory updates
- [ ] Industry/jurisdiction filtering in onboarding

**Phase 3: Scale (With Revenue)**

- [ ] Partner with Thomson Reuters or CUBE for broader coverage
- [ ] Multi-jurisdiction (UK, US, APAC)
- [ ] Real-time monitoring with <24hr update SLA

---

## 🔴 Critical Path (Do First)

| Priority | Task                              | Est. Time | Status  |
| -------- | --------------------------------- | --------- | ------- |
| 1        | Database seed script              | 4 hrs     | ✅ DONE |
| 2        | tRPC API layer (all 22 endpoints) | 8 hrs     | ✅ DONE |
| 3        | Dashboard connected to APIs       | 4 hrs     | 🔜 NEXT |
| 4        | Auth testing + forgot password    | 2 hrs     | ⏳      |
| 5        | EUR-Lex ingestion (DORA/GDPR/AI)  | 6 hrs     | ⏳ NEW  |

---

## 📋 15 Workstreams (200+ Items)

### 1. DATABASE FOUNDATION ✅ COMPLETE

> CRITICAL PATH - Nothing works without this

- [x] Create seed.ts script in /src/db/seed.ts
- [x] Seed DORA (17 key articles), GDPR (99 articles), AI Act (85 articles), Basel III
- [x] Each article needs: full text, AI summary, risk level, effective date
- [x] Create 50+ sample obligations linked to articles
- [x] Create 10 sample systems (Core Banking, Payment Gateway, Mobile App, CRM, Analytics Engine, etc.)
- [x] Create article-system impact mappings (which articles affect which systems)
- [x] Create sample alerts with realistic timelines
- [x] Run migrations on Vercel Postgres
- [x] Verify all foreign keys and relations work

**DELIVERABLE:** ✅ `npm run db:seed` populates full demo environment

---

### 2. TRPC API LAYER ✅ COMPLETE

> Build every endpoint needed for full product

**Regulations** ✅

- [x] `regulations.list` - paginated, filterable by jurisdiction/status
- [x] `regulations.getById` - with articles, obligations, impacted systems
- [x] `regulations.create/update/delete` (admin only)
- [x] `regulations.getJurisdictions` - list unique jurisdictions

**Articles** ✅

- [x] `articles.list` - by regulation, risk level
- [x] `articles.getById` - with obligations, system impacts

**Alerts** ✅

- [x] `alerts.list` - filterable by severity/status/regulation/owner
- [x] `alerts.getById` - full detail with linked regulation/article
- [x] `alerts.create` - from regulatory changes
- [x] `alerts.updateStatus` - open→in_progress→resolved
- [x] `alerts.assign` - assign owner
- [x] `alerts.bulkUpdateStatus` - bulk status changes
- [x] `alerts.bulkAssign` - bulk owner assignment
- [x] `alerts.getStats` - counts by status/severity

**Obligations** ✅

- [x] `obligations.list` - by article, status, with stats
- [x] `obligations.getById` - with article and system impacts
- [x] `obligations.updateStatus` - pending→compliant→non_compliant
- [x] `obligations.bulkUpdateStatus` - bulk status changes

**Systems** ✅

- [x] `systems.list` - all org systems with criticality and impact counts
- [x] `systems.getById` - with all impacted articles grouped by regulation
- [x] `systems.create/update/delete`
- [x] `systems.addImpact/removeImpact` - manage article impacts
- [x] `systems.getByArticle` - what systems does this article affect
- [x] `systems.getArticlesForSystem` - what articles impact this system

**Evidence Packs** ✅

- [x] `evidencePacks.list` - history of generated packs
- [x] `evidencePacks.getById` - with related obligations
- [x] `evidencePacks.generate` - create new pack for regulation/article
- [x] `evidencePacks.delete` - remove pack
- [x] `evidencePacks.getStats` - counts by format

**Dashboard** ✅

- [x] `dashboard.getStats` - controls at risk, systems impacted, compliance rate
- [x] `dashboard.getComplianceByRegulation` - breakdown per regulation
- [x] `dashboard.getRecentAlerts` - latest alerts
- [x] `dashboard.getRegulatoryFeed` - regulatory change timeline
- [x] `dashboard.getSystemImpactOverview` - systems with risk levels
- [x] `dashboard.getEvidencePackSummary` - pack counts and recent

**Requirements:** ✅ ALL ENDPOINTS are org-scoped, authenticated, input validated with Zod

---

### 3. DASHBOARD - LIVE DATA 🔜 NEXT UP

> Replace all mock data, add real-time feel

- [ ] RegulatoryFeed component → `dashboard.getRegulatoryFeed` API
- [ ] SystemImpactOverview → `dashboard.getSystemImpactOverview` API
- [ ] ComplianceStatus → `dashboard.getStats` API
- [ ] Main dashboard page → `dashboard.getStats` for hero metrics
- [ ] Add skeleton loaders during fetch
- [ ] Add error boundaries with retry buttons
- [ ] Add 'last updated' timestamps
- [ ] Add refresh button for manual reload
- [ ] WebSocket/polling for real-time updates (every 30s)
- [ ] Add notification badge for new changes since last visit
- [ ] Empty states with CTAs (No alerts? Great! or Add your first system)

**PSYCHOLOGY:** Dashboard should create urgency (red badges, countdowns to deadlines) but also reward progress (green checkmarks, compliance % going up)

---

### 4. REGULATIONS PAGE - FULL BUILD

> The knowledge base of all regulations

**List View**

- [ ] Cards showing regulation name, jurisdiction, article count, compliance %
- [ ] Search: Full-text search across regulation names, articles, content
- [ ] Filters: Jurisdiction (EU, US, UK), Status (Active, Upcoming, Archived), Risk Level
- [ ] Sort: By name, effective date, compliance %, last updated

**Detail Page**

- [ ] Header: Name, full title, jurisdiction, effective date, last updated
- [ ] Tab 1: Articles list (collapsible, shows AI summary)
- [ ] Tab 2: Obligations (status badges, owners)
- [ ] Tab 3: Impacted Systems (with criticality indicators)
- [ ] Tab 4: Timeline (regulatory changes history)
- [ ] Tab 5: Evidence Packs (generated docs)
- [ ] AI Summary panel: Plain English explanation of what this regulation means for you
- [ ] 'Generate Evidence Pack' CTA button
- [ ] 'Subscribe to changes' toggle

**URL structure:** `/dashboard/regulations`, `/dashboard/regulations/[id]`

---

### 5. ALERTS PAGE - FULL BUILD

> Action center for compliance team

**List View**

- [ ] List view matching screenshot design
- [ ] Filters: Severity (Critical/High/Medium/Low), Regulation, Status, Owner, Date range
- [ ] Bulk actions: Assign multiple, Change status, Export

**Alert Detail**

- [ ] Full description of the regulatory change
- [ ] What articles are affected
- [ ] What systems are impacted (with links)
- [ ] What obligations need review
- [ ] Owner assignment dropdown
- [ ] Status workflow buttons
- [ ] Comments/activity thread
- [ ] 'Generate Evidence Pack' button

**Features**

- [ ] Create alert manually (for internal compliance discoveries)
- [ ] Alert priority scoring (auto-calculated from: severity × systems impacted × deadline proximity)
- [ ] Deadline countdown (days until effective)
- [ ] Email notifications when assigned to you
- [ ] Slack integration for critical alerts

**PSYCHOLOGY:** Critical alerts should feel URGENT (pulsing red, bold text). Resolved alerts should feel SATISFYING (checkmark animation, confetti for clearing all critical)

---

### 6. SYSTEM MAP - FULL BUILD

> Visual dependency graph (DIFFERENTIATOR FEATURE)

**Core Functionality**

- [ ] Use @xyflow/react (React Flow) for interactive graph
- [ ] Node types: System (circle), Regulation (rounded rect), Article (small rect)
- [ ] Node colors by criticality/risk level
- [ ] Edges show relationships: system↔article impacts

**Filters Sidebar**

- [ ] By Regulation
- [ ] By Criticality (Critical/High/Medium/Low)
- [ ] By Evidence State (Complete/Partial/Missing)
- [ ] Show/hide single points of failure

**Interactions**

- [ ] Click node → side panel with details
- [ ] Highlight path: Click a regulation → highlight all affected systems
- [ ] Add/edit systems inline
- [ ] Drag-and-drop to reorganize layout (save position)

**Export & Navigation**

- [ ] Export graph as PNG/SVG for reports
- [ ] Mini-map for large graphs
- [ ] Zoom controls

**PSYCHOLOGY:** This is the 'wow' feature for demos. Make it smooth, animated, and visually impressive. Executives love seeing their entire compliance landscape at a glance.

---

### 7. EVIDENCE PACKS - FULL BUILD

> THE MONEY FEATURE - This is what they pay for

**Generator Page**

- [ ] Evidence Pack Generator page (matches screenshot)
- [ ] Select regulation → shows articles → shows obligations
- [ ] Checklist of required evidence per obligation
- [ ] Status indicators: Complete (green), Partial (yellow), Missing (red)
- [ ] Attach documents/links as evidence
- [ ] Auto-pull from integrations (Jira tickets, Confluence pages)

**PDF Generation**

- [ ] Cover page with org logo, date, regulation
- [ ] Table of contents
- [ ] Executive summary
- [ ] Each article with compliance status
- [ ] Each obligation with evidence attached
- [ ] Appendix with full regulation text

**Export Options**

- [ ] Download PDF
- [ ] Send to Confluence (create page hierarchy)
- [ ] Create Jira epic with tasks per obligation
- [ ] Email to stakeholders

**Management**

- [ ] History: All generated packs with date, who generated, download link
- [ ] Schedule: Auto-generate weekly/monthly
- [ ] Diff view: Compare this pack to last pack (what changed)

**PSYCHOLOGY:** Auditors love documentation. Make the output BEAUTIFUL and PROFESSIONAL. This PDF represents their organization to regulators.

---

### 8. OBLIGATIONS PAGE - FULL BUILD

> Compliance task management

**Views**

- [ ] List view: All obligations across all regulations
- [ ] Filters: By regulation, article, status, owner, due date
- [ ] Kanban view option: Columns for Pending/Compliant/Non-Compliant

**Obligation Detail**

- [ ] Linked article (click to expand)
- [ ] Status toggle with confirmation
- [ ] Evidence attachments
- [ ] Review history (who changed status, when)
- [ ] Next review date
- [ ] Owner assignment
- [ ] Notes/comments

**Features**

- [ ] Bulk status update
- [ ] Set review reminders (email notification)
- [ ] Compliance trend chart: % compliant over time
- [ ] Risk score: Non-compliant obligations × severity = risk score

**PSYCHOLOGY:** Make 'Compliant' status feel rewarding. Progress bar showing 67% → 68% compliance. Gamify the compliance process.

---

### 9. SETTINGS PAGE - FULL BUILD

> Org management, integrations, billing

**Organization Tab**

- [ ] Name, logo upload, industry, size
- [ ] Billing email
- [ ] Delete organization (danger zone)

**Team Tab**

- [ ] Member list with roles (Owner/Admin/Member)
- [ ] Invite by email
- [ ] Remove member
- [ ] Change role
- [ ] Pending invitations

**Notifications Tab**

- [ ] Email preferences (critical alerts, weekly digest, etc.)
- [ ] Slack webhook URL
- [ ] Notification frequency

**Integrations Tab**

- [ ] Jira: Connect account, select project
- [ ] Confluence: Connect account, select space
- [ ] Slack: Add to workspace button
- [ ] API Keys: Generate/revoke for custom integrations

**Billing Tab**

- [ ] Current plan
- [ ] Usage stats
- [ ] Upgrade/downgrade buttons
- [ ] Payment method
- [ ] Invoices history

**Data Tab**

- [ ] Export all data (GDPR compliance)
- [ ] Import regulations/systems from CSV

---

### 10. AUTH HARDENING

> Production-ready authentication

**Core Auth**

- [ ] Test full signup flow end-to-end
- [ ] Test signin flow end-to-end
- [ ] Implement forgot password (email reset link)
- [ ] Add email verification requirement
- [ ] Add password strength requirements

**Session Management**

- [ ] Implement session timeout (configurable)
- [ ] Add 'Remember me' checkbox
- [ ] Force logout all sessions option

**Security**

- [ ] Rate limit login attempts (5 per minute)
- [ ] Audit log: All auth events logged
- [ ] Password change requires current password

**OAuth & Advanced**

- [ ] Add Google OAuth
- [ ] Add Microsoft OAuth (enterprise customers)
- [ ] Magic link login option
- [ ] 2FA with TOTP (authenticator apps)

---

### 11. AI INTEGRATION

> LLM-powered compliance intelligence

**Setup**

- [ ] OpenAI/Anthropic integration setup
- [ ] Cost tracking: Monitor API usage per org
- [ ] Caching: Don't re-summarize same content

**Features**

- [ ] Regulation summarizer: Full legal text → plain English
- [ ] Article explainer: 'What does this mean for my org?'
- [ ] Obligation extractor: Parse article → generate draft obligations
- [ ] Impact assessor: 'Which of my systems does this affect?' (RAG over system descriptions)
- [ ] Evidence suggester: 'What evidence do I need to prove compliance?'
- [ ] Change analyzer: 'What changed between old and new version of article?'
- [ ] Compliance Q&A: Chat interface to ask questions about regulations
- [ ] Auto-generate alert descriptions from regulatory text
- [ ] Smart search: Natural language queries across all content

**PSYCHOLOGY:** AI features are the 'magic' that justifies the price. Make them feel instant and intelligent. Show 'AI-generated' badge for transparency.

---

### 12. ONBOARDING FLOW

> First 5 minutes determine if they convert

**Wizard Steps**

- [ ] Welcome modal after signup
- [ ] Step 1: 'What industry are you in?' (pre-selects relevant regulations)
- [ ] Step 2: 'What regulations apply to you?' (checkbox list)
- [ ] Step 3: 'Add your first systems' (quick-add with templates)
- [ ] Step 4: 'Invite your team' (skip option)

**Guidance**

- [ ] Progress bar showing setup completion
- [ ] 'Take a tour' button → interactive walkthrough
- [ ] Highlight key features with tooltips
- [ ] Sample data option: 'Populate with demo data'
- [ ] Checklist widget: 'Complete your setup' (persists until done)

**First Win**

- [ ] First-win moment: Generate first evidence pack within 5 minutes
- [ ] Success email after first evidence pack generated

**PSYCHOLOGY:** Reduce time-to-value. They should see the product's value within 2 minutes. Every click without value = higher churn risk.

---

### 13. STRIPE BILLING

> Revenue infrastructure

**Products**

- [ ] Starter: Free, 1 user, 2 regulations, 5 systems
- [ ] Professional: $299/mo, 10 users, unlimited regulations/systems, integrations
- [ ] Enterprise: Custom, SSO, dedicated support, SLA

**Checkout**

- [ ] Checkout flow from pricing page
- [ ] Trial: 14 days of Professional free
- [ ] Upgrade prompts when hitting limits
- [ ] Customer portal (manage subscription, update payment)

**Webhooks**

- [ ] `checkout.session.completed` → activate subscription
- [ ] `invoice.paid` → extend subscription
- [ ] `invoice.payment_failed` → send warning email, grace period
- [ ] `customer.subscription.deleted` → downgrade to free

**Advanced**

- [ ] Usage-based billing option: Per evidence pack generated
- [ ] Annual discount: 2 months free
- [ ] Promo codes for sales team
- [ ] Invoice customization (add VAT, PO number)

**PSYCHOLOGY:** Make upgrading feel like unlocking superpowers, not paying a tax. Show what they're missing on free tier.

---

### 14. PRODUCTION HARDENING

> Ship quality, not demo quality

**Monitoring & Analytics**

- [ ] Error monitoring: Sentry integration
- [ ] Analytics: Vercel Analytics + custom events
- [ ] Logging: Structured logs with request IDs
- [ ] Health check endpoint: /api/health

**Performance**

- [ ] Performance: Core Web Vitals all green
- [ ] Load testing: Can handle 1000 concurrent users

**Security**

- [ ] Security headers: CSP, HSTS, X-Frame-Options
- [ ] Rate limiting: All API endpoints
- [ ] Input sanitization: XSS prevention
- [ ] SQL injection: Drizzle handles, but audit anyway
- [ ] CORS: Proper configuration

**SEO & Accessibility**

- [ ] SEO: All meta tags, sitemap.xml, robots.txt
- [ ] Mobile responsive: Every page works on phone
- [ ] Accessibility: WCAG 2.1 AA compliance
- [ ] Browser testing: Chrome, Firefox, Safari, Edge

**Resilience**

- [ ] Graceful error pages: 404, 500 custom designs
- [ ] Backup strategy: Automated DB backups
- [ ] Print styles: Evidence packs print correctly

---

### 15. MARKETING SITE POLISH

> Convert visitors to signups

**Branding**

- [ ] Favicon: Cindral 'C' logo
- [ ] OG image: Branded social share image
- [ ] Logo SVG: Replace placeholder in navbar/footer
- [ ] Hero video: 30-second product demo autoplay

**Social Proof**

- [ ] Social proof: Real logos when available (or 'Trusted by X companies')
- [ ] Testimonials: Get 3 beta user quotes
- [ ] Case study: One detailed customer story

**Content**

- [ ] Pricing: A/B test price points
- [ ] Blog: SEO content on regulations (DORA explained, etc.)
- [ ] Changelog: Public product updates
- [ ] Documentation: docs.trycindral.com (for integrations)
- [ ] Compare pages: 'Cindral vs spreadsheets', 'Cindral vs [competitor]'

**Conversion**

- [ ] ROI calculator: 'See how much time you'll save'
- [ ] Exit intent popup: 'Book a demo before you go'
- [ ] Chat widget: Intercom/Crisp for live support
- [ ] Cookie consent: GDPR compliant banner

**Infrastructure**

- [ ] Status page: status.trycindral.com

**PSYCHOLOGY:** Every element should answer 'Why should I trust you?' and 'What's in it for me?'

---

## 🧠 Product Psychology Triggers

| Trigger                   | Implementation                                                       |
| ------------------------- | -------------------------------------------------------------------- |
| **Urgency**               | Red pulsing badges on critical alerts, countdown timers to deadlines |
| **Progress**              | Compliance % going up, checkmark animations, confetti on milestones  |
| **Fear**                  | "24 controls at risk" prominently displayed, deadline warnings       |
| **Social Proof**          | "67% of DORA-covered institutions use X approach"                    |
| **Instant Gratification** | Generate evidence pack in <30 seconds                                |
| **Gamification**          | "Complete your setup" checklist, streaks for daily reviews           |

---

## 📅 Execution Timeline

| Phase                        | Workstreams   | Duration   |
| ---------------------------- | ------------- | ---------- |
| **Phase 1: Foundation**      | 1, 2, 10      | Week 1-2   |
| **Phase 2: Core Product**    | 3, 4, 5, 8    | Week 3-5   |
| **Phase 3: Differentiators** | 6, 7          | Week 6-8   |
| **Phase 4: Growth**          | 9, 11, 12, 13 | Week 9-10  |
| **Phase 5: Polish**          | 14, 15        | Week 11-12 |

---

## ✅ Definition of Done

A feature is "done" when:

1. Code is written and type-safe
2. Works on mobile and desktop
3. Has loading and error states
4. Is org-scoped (multi-tenant)
5. Has proper auth checks
6. Is deployed to production
7. Has been tested by a real user

---

_This roadmap is a living document. Update as priorities shift._
