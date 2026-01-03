// Supabase Edge Function: send-toolkit
// Sends the Startup Maturity Toolkit to user's email
// Stores submission in toolkit_downloads table
//
// Deploy with: supabase functions deploy send-toolkit
// Set secrets: supabase secrets set RESEND_API_KEY=your_key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Toolkit PDF URL in Supabase Storage
const TOOLKIT_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co/storage/v1/object/public/toolkit/Startup-Maturity-Workbook-v2.pdf'

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
    const { email, wants_updates = false } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Store the download request
    const { error: insertError } = await supabase
      .from('toolkit_downloads')
      .insert({
        email: email.toLowerCase().trim(),
        wants_updates,
        downloaded_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Database insert error:', insertError)
      // Continue anyway - don't block email delivery for DB issues
    }

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ChiStartupHub <hello@chistartuphub.com>',
        to: [email],
        subject: 'Your Startup Maturity Workbook is here',
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #050A14; padding: 40px; border-left: 4px solid #3B82F6;">

              <h1 style="color: #ffffff; font-family: Georgia, serif; font-size: 28px; margin: 0 0 24px 0; font-weight: 400;">
                Your workbook is ready.
              </h1>

              <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.8; margin: 0 0 24px 0;">
                Thank you for downloading the Startup Maturity Workbook. This is a framework for knowing what to do next—designed to be used monthly for at least 90 days.
              </p>

              <div style="background: #0A1220; border: 1px solid rgba(255,255,255,0.12); padding: 24px; margin: 24px 0;">
                <p style="color: #3B82F6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 0;">
                  What's Inside
                </p>
                <ul style="color: rgba(255,255,255,0.7); font-size: 13px; line-height: 2; margin: 0; padding-left: 20px;">
                  <li>4 Dimensions: Problem, Growth, Operations, Brand</li>
                  <li>3 Phases: Validate → Systematize → Scale</li>
                  <li>12 Action Guides with principles and menus</li>
                  <li>Monthly check-in and 90-day review templates</li>
                  <li>Capital section: when to raise and common mistakes</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${TOOLKIT_URL}"
                   style="display: inline-block; background: #ffffff; color: #050A14; padding: 16px 32px; text-decoration: none; font-weight: 600; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">
                  Download Workbook (PDF)
                </a>
              </div>

              <div style="background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3B82F6; padding: 16px; margin: 24px 0;">
                <p style="color: rgba(255,255,255,0.9); font-size: 13px; font-style: italic; margin: 0;">
                  "The value isn't in any single use. It's in the pattern that emerges over time."
                </p>
              </div>

              <p style="color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.8; margin: 24px 0 0 0;">
                Use it this month. Come back next month. The questions stay the same—your answers will evolve.
              </p>

              <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 32px 0;">

              <p style="color: rgba(255,255,255,0.3); font-size: 11px; text-align: center; margin: 0;">
                ChiStartupHub — Your Launchpad for the Chicago Startup Ecosystem<br>
                <a href="https://chistartuphub.com" style="color: rgba(255,255,255,0.3);">chistartuphub.com</a>
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

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Toolkit sent to your email!'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
