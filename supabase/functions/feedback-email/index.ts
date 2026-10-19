// squared.today — email each new feedback note to the maker.
// Called by a Supabase Database Webhook on INSERT into public.feedback (see README → "Feedback by email").
// Secrets (Dashboard → Edge Functions → Secrets): RESEND_API_KEY, FEEDBACK_TO (where the email goes),
// optionally FEEDBACK_FROM (a verified Resend sender; defaults to Resend's test sender).
import { createClient } from 'npm:@supabase/supabase-js@2'

type Payload = { type: string; table: string; record: { user_id: string; body: string; created_at: string } }

Deno.serve(async (req) => {
  const { type, table, record } = (await req.json()) as Payload
  if (type !== 'INSERT' || table !== 'feedback') return new Response('ignored', { status: 200 })

  // Who sent it: their account email (the service role can read auth users).
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data } = await admin.auth.admin.getUserById(record.user_id)
  const from = data.user?.email ?? 'someone'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('FEEDBACK_FROM') ?? 'squared <onboarding@resend.dev>',
      to: Deno.env.get('FEEDBACK_TO'),
      reply_to: data.user?.email,
      subject: `squared feedback from ${from}`,
      text: `${record.body}\n\n— ${from}, ${new Date(record.created_at).toUTCString()}`,
    }),
  })
  if (!res.ok) return new Response(`resend: ${res.status} ${await res.text()}`, { status: 500 })
  return new Response('sent', { status: 200 })
})
