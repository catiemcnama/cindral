# Seed Snapshot

## Organizations

- **FinBank EU** (finbank-eu)
- **PayTech UK** (paytech-uk)

## Example Logins

| Email                          | Org        | Role              |
| ------------------------------ | ---------- | ----------------- |
| admin+finbank@cindral.dev      | FinBank EU | OrgAdmin          |
| compliance+finbank@cindral.dev | FinBank EU | ComplianceManager |
| auditor+finbank@cindral.dev    | FinBank EU | Auditor           |
| viewer+finbank@cindral.dev     | FinBank EU | Viewer            |
| admin+paytech@cindral.dev      | PayTech UK | OrgAdmin          |
| compliance+paytech@cindral.dev | PayTech UK | ComplianceManager |

## Hero Chain Example (FinBank EU)

```
Regulation: finbank-dora
  └── Article: finbank-dora-art-1
      └── Obligation: finbank-dora-OBL-001
          └── System: finbank-core-banking
              └── Alert: finbank-eu-ALT-001
```

## Role Permissions

- **OrgAdmin**: Full access, can delete regulations
- **ComplianceManager**: Can mutate compliance data
- **Auditor**: Read-only access
- **Viewer**: Read-only access
- **BillingAdmin**: Billing management

## Obligation Status Workflow

```
not_started → in_progress → implemented → under_review → verified
```

## Alert Status Workflow

```
open → in_triage → in_progress → resolved
                              └→ wont_fix
```

## Sample Entity IDs

### FinBank EU

- Regulation: `finbank-dora`, `finbank-gdpr`
- Article: `finbank-dora-art-1` through `finbank-dora-art-7`
- Obligation: `finbank-dora-OBL-001` through `finbank-dora-OBL-030`
- System: `finbank-core-banking`, `finbank-payments-switch`, `finbank-customer-portal`, `finbank-cloud-data-lake`
- Alert: `finbank-eu-ALT-001` through `finbank-eu-ALT-004`

### PayTech UK

- Regulation: `paytech-dora`, `paytech-gdpr`
- Article: `paytech-dora-art-1` through `paytech-dora-art-7`
- Obligation: `paytech-dora-OBL-001` through `paytech-dora-OBL-030`
- System: `paytech-checkout-api`, `paytech-fraud-engine`, `paytech-support-desk`, `paytech-compliance-grc`
- Alert: `paytech-uk-ALT-001` through `paytech-uk-ALT-004`

## Verification Queries

```sql
-- Check org isolation
SELECT organization_id, COUNT(*) as count
FROM obligations
GROUP BY organization_id;

-- Check obligation status distribution
SELECT organization_id, status, COUNT(*)
FROM obligations
GROUP BY organization_id, status
ORDER BY organization_id, status;

-- Check audit log has entries
SELECT organization_id, action, COUNT(*)
FROM audit_log
GROUP BY organization_id, action;

-- Hero chain query
SELECT
  r.id as regulation_id,
  a.id as article_id,
  o.id as obligation_id,
  osm.system_id,
  alt.id as alert_id
FROM regulations r
JOIN articles a ON a.regulation_id = r.id
JOIN obligations o ON o.article_id = a.id
LEFT JOIN obligation_system_mappings osm ON osm.obligation_id = o.id
LEFT JOIN alerts alt ON alt.regulation_id = r.id
WHERE r.organization_id = 'finbank-eu'
LIMIT 5;
```
