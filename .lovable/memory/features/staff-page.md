---
name: Staff Page
description: Dedicated /stafi page with category filter (B, C1, C, CE, D), reads from staff table
type: feature
---
Route: /stafi
Source: Supabase `staff` table (is_active=true, ordered by display_order)
Filters: "Të gjithë" + B, C1, C, CE, D — chip-style buttons with counts
Match logic: parse comma-separated `categories` field, includes selected cat
Header has back link to "/"; landing page Stafi nav buttons should use Link to /stafi
