// Supabase Edge Function: notify-founder
// Sends email to founder when someone offers to help with their ask
// Includes 48-hour response deadline
// 
// Deploy with: supabase functions deploy notify-founder
// Set secrets: supabase secrets set RESEND_API_KEY=your_key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface ConnectionRequest {
  id: string
  ask_id: string
  requester_id: string
  founder_id: string
  requester_linkedin: string
  requester_context: string
  requester_email: string
  requester_name: string
  expires_at: string
}

interface FounderAsk {
  id: string
  category: string
  sector: string
  description: string
  amount?: string
  user_id: string
}

interface UserProfile {
  id: string
  email: string
  full_name: string
}

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

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Get the connection request
    const { data: request, error: requestError } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('id', connection_request_id)
      .single()

    if (requestError || !request) {
      return new Response(
        JSON.stringify({ error: 'Connection request not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const connectionRequest = request as ConnectionRequest

    // Get the ask details
    const { data: ask, error: askError } = await supabase
      .from('founder_asks')
      .select('*')
      .eq('id', connectionRequest.ask_id)
      .single()

    if (askError || !ask) {
      return new Response(
        JSON.stringify({ error: 'Ask not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const founderAsk = ask as FounderAsk

    // Get founder's profile
    const { data: founder, error: founderError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', connectionRequest.founder_id)
      .single()

    if (founderError || !founder) {
      return new Response(
        JSON.stringify({ error: 'Founder profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const founderProfile = founder as UserProfile

    // Get founder's email from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
      connectionRequest.founder_id
    )

    if (authError || !authUser?.user?.email) {
      return new Response(
        JSON.stringify({ error: 'Founder email not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const founderEmail = authUser.user.email

    // Format category for display
    const categoryLabels: Record<string, string> = {
      fundraising: 'Fundraising',
      cofounder: 'Co-founder Search',
      general_advice: 'General Advice',
    }
    const categoryLabel = categoryLabels[founderAsk.category] || founderAsk.category

    // Calculate expiration time for display
    const expiresAt = connectionRequest.expires_at 
      ? new Date(connectionRequest.expires_at).toLocaleString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric', 
          hour: 'numeric', 
          minute: '2-digit',
          timeZoneName: 'short'
        })
      : '48 hours from now'

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ChiStartupHub <hello@chistartuphub.com>',
        to: [founderEmail],
        subject: `Someone wants to help with your ${categoryLabel} ask`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #0a0a0a; padding: 30px; border-radius: 8px;">
              <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">
                Someone wants to help! 🤝
              </h1>
              
              <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6;">
                Hi ${founderProfile.full_name || 'there'},
              </p>
              
              <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6;">
                <strong style="color: #ffffff;">${connectionRequest.requester_name}</strong> saw your ask on ChiStartupHub and wants to connect.
              </p>
              
              <div style="background: #1a1a1a; border-left: 3px solid #666; padding: 16px; margin: 20px 0;">
                <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">
                  Your Ask
                </p>
                <p style="color: #ffffff; font-size: 14px; margin: 0;">
                  ${founderAsk.description.substring(0, 200)}${founderAsk.description.length > 200 ? '...' : ''}
                </p>
                <p style="color: #666; font-size: 12px; margin: 8px 0 0 0;">
                  ${categoryLabel} • ${founderAsk.sector}${founderAsk.amount ? ` • $${founderAsk.amount}` : ''}
                </p>
              </div>
              
              <div style="background: #1a2e1a; border-left: 3px solid #22c55e; padding: 16px; margin: 20px 0;">
                <p style="color: #22c55e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">
                  How They Can Help
                </p>
                <p style="color: #a0a0a0; font-size: 14px; margin: 0;">
                  ${connectionRequest.requester_context}
                </p>
              </div>
              
              <div style="background: #2a1a1a; border: 1px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="color: #dc2626; font-size: 14px; font-weight: 600; margin: 0;">
                  ⏰ Respond within 48 hours
                </p>
                <p style="color: #a0a0a0; font-size: 12px; margin: 8px 0 0 0;">
                  This request expires: ${expiresAt}
                </p>
              </div>
              
              <div style="margin: 24px 0; text-align: center;">
                <a href="https://chistartuphub.com/profile?tab=requests" 
                   style="display: inline-block; background: #ffffff; color: #0a0a0a; padding: 14px 28px; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 6px; margin-right: 10px;">
                  Review Request →
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center;">
                Accept to share your LinkedIn, or decline to pass.
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
      const errorData = await emailResponse.json()
      console.error('Resend error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorData }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Mark the request as notified
    await supabase
      .from('connection_requests')
      .update({ notification_sent: true, notification_sent_at: new Date().toISOString() })
      .eq('id', connection_request_id)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent to founder' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
