import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function client() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Records the terminal outcome in the project's own notification tables.
// These rows never gate future sends — Lovable enforces suppression at send time.
async function record(
  recipient: string,
  reason: 'bounce' | 'complaint' | 'unsubscribe',
  status: 'bounced' | 'complained' | 'suppressed',
  message: string,
  eventId: string,
) {
  const supabase = client()
  const email = (recipient ?? '').toLowerCase()

  const { error: suppressError } = await supabase
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })

  if (suppressError) {
    console.error('Failed to upsert suppressed email', {
      code: suppressError.code,
      message: suppressError.message,
      event_id: eventId,
    })
    throw new Error('Failed to write suppression')
  }

  const { error: logError } = await supabase.from('email_send_log').insert({
    message_id: null,
    template_name: 'system',
    recipient_email: email,
    status,
    error_message: message,
    metadata: null,
  })

  if (logError) {
    console.error('Failed to insert email_send_log', {
      code: logError.code,
      message: logError.message,
      event_id: eventId,
    })
    throw new Error('Failed to write send log')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await record(
        event.data.recipient,
        'bounce',
        'bounced',
        'Permanent bounce — email address is invalid or rejected',
        event.event_id,
      )
    },
    'email.complaint': async (event) => {
      await record(
        event.data.recipient,
        'complaint',
        'complained',
        'Spam complaint — recipient marked email as spam',
        event.event_id,
      )
    },
    'email.unsubscribed': async (event) => {
      await record(
        event.data.recipient,
        'unsubscribe',
        'suppressed',
        'Recipient unsubscribed',
        event.event_id,
      )
    },
  },
})

Deno.serve((req) => handler(req))
