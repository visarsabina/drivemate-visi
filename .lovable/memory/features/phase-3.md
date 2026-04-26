---
name: Phase 3 — Branding, Public Pages, User Management
description: Per-tenant branding, /school/:slug public landing, hostname-based tenant routing, and tenant-scoped user management
type: feature
---

# Faza 3

## Tenant branding (UI)
- `src/hooks/useTenantBranding.ts` exposes:
  - `useTenantBranding()` — for AUTHENTICATED views (Sidebar). Loads tenant
    via `user_tenants`, applies `primary_color` to CSS vars (`--primary`,
    `--ring`, `--sidebar-primary`) by converting hex → "H S% L%". Returns
    logo_url, name, slug, contact info, etc. Cached in module-level Map.
  - `usePublicTenantBranding(slug?)` — for PUBLIC views (Home). With a slug
    arg, looks up by `tenants.slug`. Without slug, resolves by `hostname`
    (matching `tenants.domain`), with fallback to slug "visi" so preview
    domains still render.
- `Sidebar.tsx` uses `useTenantBranding()` to show tenant logo + name.

## Public landing (multi-tenant)
- `src/pages/Home.tsx` is now fully dynamic:
  - Reads `slug` from `useParams` (route `/school/:slug`).
  - Falls back to hostname-based resolution at `/`.
  - Shows "not found" state when slug is invalid.
  - Loads `staff` filtered by `branding.id`.
  - Navbar/footer/contact use tenant logo, name, phone, email, address.
- Added route `/school/:slug` in `App.tsx`.
- Auto-redirect of admin → `/admin` is suppressed when viewing
  `/school/:slug` (so super-admins can preview tenants).

## Custom domain routing
- Already supported via `tenants.domain` field + `Anyone can view tenant by
  domain` RLS policy. `usePublicTenantBranding()` matches `window.location.hostname`
  (stripped of `www.`) against `tenants.domain`.
- Example: `autoshkollavisi.com` → tenant "visi" automatically.

## User management within tenant
- DB functions (SECURITY DEFINER):
  - `list_users_in_my_tenant()` — admin/super_admin only; returns users
    linked to caller's tenant via `user_tenants`.
  - `add_existing_user_to_my_tenant(_target_user_id, _as_admin)` — adds
    existing user to caller's tenant + optional admin role.
  - `remove_user_from_my_tenant(_target_user_id)` — removes user from
    caller's tenant (cannot remove self).
- Edge function `admin-create-user-in-tenant`:
  - Validates caller is admin via service-role.
  - Creates auth user with `admin.createUser` (no logout side-effect),
    or reuses existing user with same email.
  - Links to caller's tenant, optionally grants admin role.
- `src/components/Users.tsx` rewired:
  - `loadUsers` → `list_users_in_my_tenant`.
  - "Shto Përdorues" → invokes `admin-create-user-in-tenant`.
  - New "Hiq nga shkolla" action → `remove_user_from_my_tenant`.

## Notes
- `RegistrationDialog` accepts optional `tenantId` and `schoolName` props,
  used by Home so the form posts to the correct tenant when viewing
  `/school/:slug`.
- The legacy `get_all_users_with_roles` function still exists but is no
  longer used by the admin UI (super-admin uses `list_users_for_super_admin`).
