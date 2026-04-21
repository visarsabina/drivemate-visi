---
name: Vehicles Management
description: Auto-school vehicle fleet table with expiry tracking, photo upload, and 7-day dashboard alerts
type: feature
---

# Mjetet (Vehicles)

Admin-only menu item "Mjetet" (Car icon) in sidebar.

## Table `vehicles` (Supabase)
- name, plate_number (required)
- registration_date, inspection_expiry_date, attestation_number, attestation_expiry_date
- photo_url (uploaded to public `vehicle-photos` storage bucket)

## UI: `src/components/Vehicles.tsx`
- Table with columns: Emri, Tabelat, Regjistrimi, Kontrolla Periodike, Nr. Atestit, Skadenca Atestit, Foto, Veprime
- Photo cell = thumbnail button → opens enlarged dialog preview
- Add/Edit dialog with date inputs + file upload
- Each expiry date shows badge: red ≤7d (urgent), yellow ≤30d, neutral otherwise
- Rows with urgent expiry get destructive bg tint

## Alerts
- `VehicleAlerts.tsx` shown on dashboard above StatsCards
- Lists vehicles where inspection or attestation expires within 7 days (or already expired)
- "Shiko Mjetet" button switches to vehicles view

## RLS
- Admins-only for all CRUD on `vehicles` table
- Photos publicly readable, admin-only write
