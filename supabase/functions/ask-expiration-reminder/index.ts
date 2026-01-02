// Supabase Edge Function: ask-expiration-reminder
// Sends reminder emails to founders 2 days before their ask expires
// Should be triggered by a cron job daily
// 
// Deploy with: supabase functions deploy ask-expiration-reminder
// Set up cron: Use Supabase's pg_cron or external scheduler

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface FounderAsk {
  id: string
  category: string
  sector: string
  description: string
  amount?: string
  user_id: string
  expires_at: string
  reminder_sent: boolean
}

interface UserProfile {
  id: string
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
    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Find asks expiring in 2 days that haven't been reminded
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
    const twoDaysFromNowStart = new Date(twoDaysFromNow)
    twoDaysFromNowStart.setHours(0, 0, 0, 0)
    const twoDaysFromNowEnd = new Date(twoDaysFromNow)
    twoDaysFromNowEnd.setHours(23, 59, 59, 999)

    const { data: expiringAsks, error: asksError } = await supabase
      .from('founder_asks')
      .select('*')
      .eq('is_active', true)
      .eq('reminder_sent', false)
      .gte('expires_at', twoDaysFromNowStart.toISOString())
      .lte('expires_at', twoDaysFromNowEnd.toISOString())

    if (asksError) {
      console.error('Error fetching expiring asks:', asksError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch expiring asks' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    for (const ask of (expiringAsks || []) as FounderAsk[]) {
      try {
        // Get founder's profile
        const { data: founder } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', ask.user_id)
          .single()

        const founderProfile = founder as UserProfile | null

        // Get founder's email from auth.users
        const { data: authUser } = await supabase.auth.admin.getUserById(ask.user_id)

        if (!authUser?.user?.email) {
          console.error(`No email found for user ${ask.user_id}`)
          continue
        }

        const founderEmail = authUser.user.email
        const founderName = founderProfile?.full_name || 'there'

        // Format category for display
        const categoryLabels: Record<string, string> = {
          fundraising: 'Fundraising',
          cofounder: 'Co-founder Search',
          general_advice: 'General Advice',
        }
        const categoryLabel = categoryLabels[ask.category] || ask.category

        // Send reminder email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'ChiStartupHub <noreply@chistartuphub.com>',
            to: [founderEmail],
            subject: `Your ${categoryLabel} ask expires in 2 days`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
                  <h1 style="font-size: 24px; font-weight: 600; color: #111827; margin: 0;">
                    Your ask expires soon ⏰
                  </h1>
                </div>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Hi ${founderName},
                </p>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Your ${categoryLabel.toLowerCase()} ask on ChiStartupHub will expire in <strong>2 days</strong>.
                </p>
                
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; margin: 20px 0;">
                  <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">
                    Your Ask
                  </p>
                  <p style="color: #111827; font-size: 14px; margin: 0;">
                    ${ask.description.substring(0, 200)}${ask.description.length > 200 ? '...' : ''}
                  </p>
                  <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0 0;">
                    ${categoryLabel} • ${ask.sector}${ask.amount ? ` • $${ask.amount}` : ''}
                  </p>
                </div>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  <strong>What would you like to do?</strong>
                </p>
                
                <div style="margin: 24px 0;">
                  <a href="https://chistartuphub.com/my-asks?refresh=${ask.id}" 
                     style="display: inline-block; background: #111827; color: white; padding: 12px 24px; text-decoration: none; font-weight: 500; font-size: 14px; margin-right: 12px;">
                    Refresh Ask (14 more days)
                  </a>
                  <a href="https://chistartuphub.com/my-asks?outcome=${ask.id}" 
                     style="display: inline-block; background: white; color: #111827; padding: 12px 24px; text-decoration: none; font-weight: 500; font-size: 14px; border: 1px solid #e5e7eb;">
                    Close & Share Outcome
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                  If you do nothing, your ask will automatically expire and we'll ask you about the outcome.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                
                <p style="color: #9ca3af; font-size: 12px;">
                  This email was sent by ChiStartupHub. 
                  <a href="https://chistartuphub.com" style="color: #6b7280;">Visit site</a>
                </p>
              </div>
            `,
          }),
        })

        if (emailResponse.ok) {
          // Mark reminder as sent
          await supabase
            .from('founder_asks')
            .update({ reminder_sent: true })
            .eq('id', ask.id)

          results.push({ askId: ask.id, status: 'sent' })
        } else {
          const errorData = await emailResponse.json()
          console.error(`Failed to send email for ask ${ask.id}:`, errorData)
          results.push({ askId: ask.id, status: 'failed', error: errorData })
        }
      } catch (error) {
        console.error(`Error processing ask ${ask.id}:`, error)
        results.push({ askId: ask.id, status: 'error', error: error.message })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
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
