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

  let tenantId: string
  let email: string
  try {
    const body = await req.json()
    tenantId = body.tenant_id || body.tenantId
    email = body.email
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!tenantId || typeof tenantId !== 'string' || !email || typeof email !== 'string') {
    return json({ error: 'tenant_id and email are required' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Only notify for a registration that actually exists and was just created.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { data: reg, error: regError } = await supabase
    .from('registrations')
    .select('id, full_name, email, phone, category, created_at, tenant_id')
    .eq('tenant_id', tenantId)
    .eq('email', email)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)
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
