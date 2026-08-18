import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing environment configuration')
    return json({ error: 'Server configuration error' }, 500)
  }

  let registrationId: string
  try {
    const body = await req.json()
    registrationId = body.registration_id || body.registrationId
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!registrationId || typeof registrationId !== 'string') {
    return json({ error: 'registration_id is required' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: reg, error: regError } = await supabase
    .from('registrations')
    .select('id, full_name, email, phone, category, created_at, tenant_id')
    .eq('id', registrationId)
    .maybeSingle()

  if (regError) {
    console.error('Registration lookup failed', regError.message)
    return json({ error: 'Lookup failed' }, 500)
  }
  if (!reg) return json({ error: 'Registration not found' }, 404)

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, email')
    .eq('id', reg.tenant_id)
    .maybeSingle()

  const recipient = tenant?.email
  if (!recipient) {
    console.log('Tenant has no notification email configured', { tenant: reg.tenant_id })
    return json({ success: false, reason: 'no_tenant_email' })
  }

  const createdAt = reg.created_at
    ? new Date(reg.created_at).toLocaleString('sq-AL', { timeZone: 'Europe/Belgrade' })
    : undefined

  const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      templateName: 'new-registration',
      recipientEmail: recipient,
      idempotencyKey: `new-registration-${reg.id}`,
      templateData: {
        schoolName: tenant?.name,
        fullName: reg.full_name,
        email: reg.email,
        phone: reg.phone,
        category: reg.category,
        createdAt,
      },
    }),
  })

  const result = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('Failed to send registration notification', res.status, result)
    return json({ success: false, reason: 'send_failed' }, 502)
  }

  return json({ success: true, result })
})
