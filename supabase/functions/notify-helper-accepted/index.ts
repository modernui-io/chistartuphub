// Supabase Edge Function: notify-helper-accepted
// Sends email to helper when founder accepts their connection request
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { connection_request_id } = await req.json()
    
    if (!connection_request_id) {
      return new Response(
        JSON.stringify({ error: 'connection_request_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Get the connection request with related data
    const { data: request, error: requestError } = await supabase
      .from('connection_requests')
      .select(`
        *,
        founder_asks (sector, description)
      `)
      .eq('id', connection_request_id)
      .single()

    if (requestError || !request) {
      return new Response(
        JSON.stringify({ error: 'Connection request not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get founder profile
    const { data: founder } = await supabase
      .from('user_profiles')
      .select('full_name, company_name')
      .eq('id', request.founder_id)
      .single()

    // Get requester profile
    const { data: requester } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', request.requester_id)
      .single()

    const founderName = founder?.full_name || 'A founder'
    const companyName = founder?.company_name ? ` from ${founder.company_name}` : ''
    const requesterName = requester?.full_name || 'there'

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ChiStartupHub <hello@chistartuphub.com>',
        to: [request.requester_email],
        subject: `🎉 ${founderName} accepted your offer to help!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #0a0a0a; padding: 30px; border-radius: 8px;">
              <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">Great news, ${requesterName}!</h1>
              
              <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6;">
                <strong style="color: #ffffff;">${founderName}${companyName}</strong> has accepted your offer to help with their ${request.founder_asks?.sector || 'startup'} ask.
              </p>
              
              <div style="background: #1a1a1a; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 3px solid #22c55e;">
                <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 10px 0;">Connect with them on LinkedIn:</p>
                <a href="${request.founder_linkedin}" style="color: #3b82f6; font-size: 16px; text-decoration: none;">
                  ${request.founder_linkedin}
                </a>
              </div>
              
              <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6;">
                Send them a connection request and mention ChiStartupHub so they know it's you!
              </p>
              
              <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
              
              <p style="color: #666; font-size: 12px; text-align: center;">
                Build Your Vision in Chicago<br>
                <a href="https://chistartuphub.com" style="color: #666;">chistartuphub.com</a>
              </p>
            </div>
          </div>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const err = await emailResponse.json()
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: err }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Helper notified of acceptance' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
