---
name: Super-Admin Panel
description: Super-admin role and /super-admin route for managing all driving schools (tenants)
type: feature
---

# Super-Admin (Faza 2)

## Role
- New enum value: `app_role.super_admin` (added to existing user_roles table).
- Owner: `visi.jaha@gmail.com` (user id `d32d8769-8dac-4c32-bb16-84192ed22997`).

## Helper
- `public.is_super_admin()` — `SECURITY DEFINER`, checks `has_role(auth.uid(), 'super_admin')`.

## RLS additions
- `tenants`: super_admin can SELECT/INSERT/UPDATE/DELETE any row.
- `user_tenants`: super_admin can SELECT/INSERT/DELETE any row.
- `user_roles`: super_admin can SELECT and ALL.

## SECURITY DEFINER functions (super-admin only)
- `create_tenant_with_admin(name, slug, domain, phone, address, email, director_name, primary_color, admin_user_id)` → tenant_id. Creates tenant, links admin via `user_tenants`, ensures `admin` role.
- `set_tenant_active(tenant_id, is_active)` — toggle activation.
- `list_all_tenants_with_stats()` — returns tenants + counts (admins, vehicles, employees).
- `list_users_for_super_admin()` — returns all auth users with their tenant_count and is_super_admin flag.

## Edge function
- `super-admin-create-tenant` (verify_jwt = false by default, validates JWT in code):
  - Validates caller has super_admin role.
  - Creates auth user (or reuses existing one with same email).
  - Calls `create_tenant_with_admin` RPC.
  - Returns `{ tenant_id, admin_user_id, admin_email }`.

## Frontend
- `src/hooks/useIsSuperAdmin.ts` → `{ isSuperAdmin, checked, loading }`.
- `src/components/SuperAdminRoute.tsx` — guards `/super-admin`.
- `src/pages/SuperAdmin.tsx` — list, stats, create dialog, activate/deactivate.
- `src/pages/Auth.tsx` — on login, super_admin → `/super-admin`, else admin → `/admin`.

## Routes
- `/super-admin` → SuperAdmin page (super_admin only).
- `/admin` → existing tenant admin panel.
