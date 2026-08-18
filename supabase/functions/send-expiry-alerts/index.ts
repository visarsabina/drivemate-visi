import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const WARN_DAYS = 1 // notify on the last day (and when already expired)

const daysUntil = (date: string | null): number | null => {
  if (!date) return null
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const d = new Date(date + 'T00:00:00Z')
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

const phrase = (label: string, days: number) =>
  days < 0
    ? `${label} skadoi para ${Math.abs(days)} ditë`
    : days === 0
      ? `${label} skadon sot`
      : `${label} skadon nesër`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* no body */ }
  const testMode = body?.test === true
  const testTenantId = typeof body?.tenantId === 'string' ? body.tenantId : null

  const today = new Date().toISOString().slice(0, 10)
  const results: Array<Record<string, unknown>> = []

  const { data: tenants, error: tErr } = await supabase
    .from('tenants')
    .select('id, name, email')
    .eq('is_active', true)
    .limit(200)

  if (tErr) {
    console.error('tenant lookup failed', tErr.message)
    return new Response(JSON.stringify({ error: 'tenant lookup failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  for (const t of tenants ?? []) {
    if (!t.email) continue
    if (testTenantId && t.id !== testTenantId) continue

    if (testMode) {
      const { error: testErr } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'expiry-alert',
          recipientEmail: t.email,
          idempotencyKey: `expiry-alert-test-${t.id}-${Date.now()}`,
          templateData: {
            schoolName: t.name,
            vehicles: [{ title: 'TEST — Golf 5 (01-234-AB)', detail: 'regjistrimi skadon sot' }],
            employees: [{ title: 'TEST — Instruktor Shembull', detail: 'licenca skadon nesër' }],
          },
        },
      })
      if (testErr) console.error('test send failed', t.id, testErr.message)
      results.push({ tenant: t.id, email: t.email, test: true, sent: !testErr })
      continue
    }

    const [{ data: vehicles }, { data: employees }] = await Promise.all([
      supabase
        .from('vehicles')
        .select('name, plate_number, inspection_expiry_date, registration_expiry_date, attestation_expiry_date')
        .eq('tenant_id', t.id),
      supabase
        .from('employees')
        .select('full_name, license_expiry_date, health_certificate_expiry_date')
        .eq('tenant_id', t.id),
    ])

    const vehicleItems: Array<{ title: string; detail: string }> = []
    for (const v of vehicles ?? []) {
      const issues: string[] = []
      const checks: Array<[string, string | null]> = [
        ['regjistrimi', v.registration_expiry_date],
        ['kontrolla', v.inspection_expiry_date],
        ['atesti', v.attestation_expiry_date],
      ]
      for (const [label, date] of checks) {
        const d = daysUntil(date)
        if (d !== null && d <= WARN_DAYS) issues.push(phrase(label, d))
      }
      if (issues.length)
        vehicleItems.push({
          title: `${v.name} (${v.plate_number})`,
          detail: issues.join(', '),
        })
    }

    const employeeItems: Array<{ title: string; detail: string }> = []
    for (const e of employees ?? []) {
      const issues: string[] = []
      const checks: Array<[string, string | null]> = [
        ['licenca', e.license_expiry_date],
        ['certifikata shëndetësore', e.health_certificate_expiry_date],
      ]
      for (const [label, date] of checks) {
        const d = daysUntil(date)
        if (d !== null && d <= WARN_DAYS) issues.push(phrase(label, d))
      }
      if (issues.length) employeeItems.push({ title: e.full_name, detail: issues.join(', ') })
    }

    if (!vehicleItems.length && !employeeItems.length) continue

    const { error: sendErr } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'expiry-alert',
        recipientEmail: t.email,
        idempotencyKey: `expiry-alert-${t.id}-${today}`,
        templateData: {
          schoolName: t.name,
          vehicles: vehicleItems,
          employees: employeeItems,
        },
      },
    })

    if (sendErr) console.error('send failed', t.id, sendErr.message)
    results.push({ tenant: t.id, vehicles: vehicleItems.length, employees: employeeItems.length, sent: !sendErr })
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
