---
name: Multi-Tenant Architecture
description: How tenants (driving schools) are isolated, including tenant_id scoping, useTenant hook, and domain-based public registration
type: feature
---

# Multi-Tenant Architecture (Faza 1)

## Tables
- **tenants**: id, name, slug, domain, logo_url, primary_color, phone, address, email, director_name, is_active
- **user_tenants**: user_id ↔ tenant_id (junction)
- All domain tables (employees, vehicles, vehicle_services, licenses, registrations, staff) have a NOT NULL `tenant_id` FK to tenants.

## Helper functions
- `public.get_user_tenant_id()` → returns the tenant_id of `auth.uid()`
- `public.user_belongs_to_tenant(_tenant_id)` → boolean check used in RLS

## RLS pattern
Every per-tenant table uses:
```
USING (has_role(auth.uid(), 'admin') AND user_belongs_to_tenant(tenant_id))
```
Public-facing reads (active staff, public registration insert) remain open but
require the target row's tenant to be active.

## Frontend
- `src/hooks/useTenant.ts` exposes `useTenant()` → `{ tenantId, loading }`.
  Always call this in components that INSERT into per-tenant tables and
  include `tenant_id: tenantId` in the insert payload.
- `resolveTenantByDomain()` (same file) is for **public** flows (no auth):
  matches `window.location.hostname` to `tenants.domain`, fallback to slug 'visi'.
- Used by `RegistrationDialog` for the public registration form.

## Seed data
- First tenant: name "Auto Shkolla Visi", slug "visi", domain "autoshkollavisi.com".
- All pre-existing rows backfilled to this tenant.
- All pre-existing admin users linked to this tenant via user_tenants.

## When adding a new per-tenant table
1. Add `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`
2. Add index on tenant_id
3. RLS policies must combine `has_role` + `user_belongs_to_tenant(tenant_id)`
4. Frontend INSERT must include `tenant_id` from `useTenant()`
