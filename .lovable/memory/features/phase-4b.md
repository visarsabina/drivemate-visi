---
name: Phase 4B — Super-Admin Statistics
description: Global statistics dashboard for super-admin with revenue charts, candidate counts, and per-tenant ranking
type: feature
---

# Faza 4B

## DB functions (SECURITY DEFINER, super-admin only)
- `super_admin_global_stats()` → jsonb with totals: tenants, candidates (by status), revenue (total/this month), open registrations, vehicles, employees.
- `super_admin_monthly_series(_months int)` → 12-month series of revenue, new candidates, new registrations.
- `super_admin_tenant_stats()` → per-tenant: candidates total/active, revenue total/this month, sorted by revenue desc.
All gated by `is_super_admin()`; raise 'forbidden' otherwise.

## Frontend
- `src/components/SuperAdminStats.tsx` — stat cards + 2 recharts (Line: revenue, Bar: candidates+registrations) + tenant ranking table.
- Mounted at the top of `src/pages/SuperAdmin.tsx`, replacing the old 3-card header.
