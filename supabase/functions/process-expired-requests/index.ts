// Supabase Edge Function: process-expired-requests
// Called by cron job to expire old requests and notify helpers
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
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Find all pending requests that have expired
    const { data: expiredRequests, error: fetchError } = await supabase
      .from('connection_requests')
      .select(`
        id,
        requester_email,
        requester_id,
        expired_notification_sent,
        founder_asks (sector, description)
      `)
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch expired requests', details: fetchError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!expiredRequests || expiredRequests.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No expired requests to process', count: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let processedCount = 0
    let notifiedCount = 0

    for (const request of expiredRequests) {
      // Update status to expired
      const { error: updateError } = await supabase
        .from('connection_requests')
        .update({ status: 'expired' })
        .eq('id', request.id)

      if (updateError) {
        console.error(`Failed to expire request ${request.id}:`, updateError)
        continue
      }

      processedCount++

      // Send notification if not already sent
      if (!request.expired_notification_sent) {
        // Get requester profile
        const { data: requester } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', request.requester_id)
          .single()

        const requesterName = requester?.full_name || 'there'
        const sector = request.founder_asks?.sector || 'startup'

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
            subject: `Your offer to help has expired`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #0a0a0a; padding: 30px; border-radius: 8px;">
                  <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">Hi ${requesterName},</h1>
                  
                  <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6;">
                    Your offer to help with the ${sector} ask on ChiStartupHub has expired after 48 hours without a response.
                  </p>
                  
                  <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6;">
                    Founders are busy building their startups, and sometimes they can't respond to every offer. Don't take it personally — your willingness to help is what makes the Chicago startup community great!
                  </p>
                  
                  <div style="background: #1a1a1a; padding: 20px; border-radius: 6px; margin: 20px 0;">
                    <p style="color: #ffffff; font-size: 14px; margin: 0;">
                      🚀 There are more founders who could use your help!
                    </p>
                  </div>
                  
                  <a href="https://chistartuphub.com/ecosystem/founder-asks" 
                     style="display: inline-block; background: #ffffff; color: #0a0a0a; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 10px;">
                    Browse More Asks →
                  </a>
                  
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

        if (emailResponse.ok) {
          // Mark notification as sent
          await supabase
            .from('connection_requests')
            .update({ expired_notification_sent: true })
            .eq('id', request.id)
          
          notifiedCount++
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedCount} expired requests, notified ${notifiedCount} helpers`,
        processed: processedCount,
        notified: notifiedCount
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
