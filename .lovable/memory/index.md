# Project Memory

## Core
Project "Auto shkolla Visi". Professional dashboard UI with blue/teal colors in glass-card style.
Multi-tenant SaaS: every per-tenant table has tenant_id; UI branding (logo, name, primary color) is dynamic per tenant via `useTenantBranding`.
Public landing at `/` resolves tenant by hostname; `/school/:slug` shows a specific tenant's landing.
Dashboard must offer quick access to Libreza, Vërtetimi, Fletparaqitja, and Kontrata.

## Memories
- [Multi-Tenant Architecture](mem://features/multi-tenant) — tenants, user_tenants, RLS pattern, useTenant hook
- [Super-Admin Panel](mem://features/super-admin) — super_admin role, /super-admin route, create_tenant_with_admin
- [Phase 3 — Branding & User Mgmt](mem://features/phase-3) — per-tenant branding, /school/:slug, tenant-scoped user management
- [Candidate Management](mem://features/candidate-management) — Candidate data fields, registration number logic, and list view status indicators
- [Payments Module](mem://features/payments) — Transaction history, automatic debt calculation, and payment slips
- [Candidate Booklet](mem://features/documents/candidate-booklet) — 4-section booklet auto-populated with profile data
- [Certificate](mem://features/documents/certificate-vertetimi) — Landscape certificate with specific lines and predefined instructors
- [Contract](mem://features/documents/contract-kontrata) — Portrait A4 contract auto-populated with candidate details and fixed director name
- [Exam Reservation](mem://features/documents/fletparaqitja) — Portrait A4 exam reservation form with boxed personal number and category grid
