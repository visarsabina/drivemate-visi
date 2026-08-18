---
name: Expiry Email Alerts
description: Daily email notification (06:00) for vehicle/employee expiry deadlines sent to each tenant's email
type: feature
---

# Njoftimet e afateve me email

- Cron `daily-expiry-alerts` (06:00 UTC) → Edge Function `send-expiry-alerts`.
- Kontrollon: vehicles (registration/inspection/attestation) dhe employees (license/health cert).
- Dërgon vetëm kur afati skadon nesër, sot, ose ka skaduar (WARN_DAYS = 1).
- Email shkon tek `tenants.email`; nëse është bosh, tenant-i kapërcehet.
- Template: `expiry-alert` (React Email, shqip, ngjyrat e brendit) përmes `send-transactional-email`.
- Idempotency key: `expiry-alert-<tenant>-<date>` (një email në ditë për autoshkollë).
- Faqja e ç'regjistrimit: `/unsubscribe`.
