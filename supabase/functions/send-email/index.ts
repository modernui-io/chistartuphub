import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "ChiStartup Hub <notifications@chistartuphub.com>";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://chistartuphub.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email templates
const templates = {
  // When admin amplifies a founder's ask
  amplification: (data: { founderName: string; askDescription: string; amplifiedAt: string }) => ({
    subject: "Your ask is being amplified across the Chicago ecosystem!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Ask is Being Amplified</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050A14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050A14; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="width: 44px; height: 44px; border: 1px solid rgba(255,255,255,0.2); display: inline-block; text-align: center; line-height: 44px;">
                      <span style="color: white; font-weight: bold; font-size: 14px;">CS</span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="font-family: monospace; font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 2px;">
                      [AMPLIFICATION: CONFIRMED]
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 0;">
              <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 400; color: white; font-family: Georgia, serif;">
                Great news, ${data.founderName}!
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.7);">
                Your ask is being amplified across the Chicago startup ecosystem. We're sharing it in our newsletter and social channels to help you find the right connections.
              </p>

              <!-- Ask Box -->
              <div style="background: rgba(251, 191, 36, 0.05); border: 1px solid rgba(251, 191, 36, 0.2); padding: 24px; margin: 24px 0;">
                <span style="font-family: monospace; font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 12px;">
                  [YOUR ASK]
                </span>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.8);">
                  "${data.askDescription}"
                </p>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.5);">
                When someone offers to help, you'll receive an email with their information. You have 48 hours to review and respond to each offer.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 24px 0; border-top: 1px solid rgba(255,255,255,0.1);">
              <a href="https://chistartuphub.com/profile" style="display: inline-block; background: white; color: #050A14; padding: 14px 28px; text-decoration: none; font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">
                View Your Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.3); font-family: monospace;">
                ChiStartup Hub • Chicago's Startup Ecosystem
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.2);">
                You're receiving this because you opted in to amplification for your ask.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }),

  // When someone offers to help with an ask
  connectionRequest: (data: {
    founderName: string;
    helperName: string;
    helperEmail: string;
    helperLinkedIn: string;
    helperMessage: string;
    askDescription: string;
  }) => ({
    subject: `${data.helperName} wants to help with your ask`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Someone Wants to Help</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050A14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050A14; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="width: 44px; height: 44px; border: 1px solid rgba(255,255,255,0.2); display: inline-block; text-align: center; line-height: 44px;">
                      <span style="color: white; font-weight: bold; font-size: 14px;">CS</span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="font-family: monospace; font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 2px;">
                      [CONNECTION: REQUEST]
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 0;">
              <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 400; color: white; font-family: Georgia, serif;">
                Someone wants to help!
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.7);">
                Hey ${data.founderName}, <strong style="color: white;">${data.helperName}</strong> saw your ask and wants to connect.
              </p>

              <!-- Ask Context -->
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 20px; margin: 24px 0;">
                <span style="font-family: monospace; font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 8px;">
                  [YOUR ASK]
                </span>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: rgba(255,255,255,0.5);">
                  "${data.askDescription}"
                </p>
              </div>

              <!-- Helper Info -->
              <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); padding: 24px; margin: 24px 0;">
                <span style="font-family: monospace; font-size: 10px; color: rgba(16, 185, 129, 0.7); text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 16px;">
                  [HELPER DETAILS]
                </span>
                <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 500; color: white;">
                  ${data.helperName}
                </p>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: rgba(255,255,255,0.5);">
                  ${data.helperEmail}
                </p>

                <span style="font-family: monospace; font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 2px; display: block; margin: 16px 0 8px 0;">
                  [HOW THEY CAN HELP]
                </span>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.8);">
                  "${data.helperMessage}"
                </p>
              </div>

              <!-- LinkedIn Button -->
              ${data.helperLinkedIn ? `
              <a href="${data.helperLinkedIn}" style="display: inline-block; background: #0A66C2; color: white; padding: 14px 28px; text-decoration: none; font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500; margin-right: 12px;">
                View LinkedIn Profile
              </a>
              ` : ''}

              <p style="margin: 24px 0 0 0; font-size: 14px; color: rgba(251, 191, 36, 0.8); background: rgba(251, 191, 36, 0.1); padding: 16px; border: 1px solid rgba(251, 191, 36, 0.2);">
                ⏰ You have <strong>48 hours</strong> to respond to this request. After that, it will expire.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 24px 0; border-top: 1px solid rgba(255,255,255,0.1);">
              <a href="https://chistartuphub.com/profile" style="display: inline-block; background: white; color: #050A14; padding: 14px 28px; text-decoration: none; font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">
                Review & Respond
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.3); font-family: monospace;">
                ChiStartup Hub • Chicago's Startup Ecosystem
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }),

  // When founder accepts a connection request
  connectionAccepted: (data: {
    helperName: string;
    founderName: string;
    founderEmail: string;
    founderLinkedIn: string;
    askDescription: string;
  }) => ({
    subject: `${data.founderName} accepted your offer to help!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connection Accepted</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050A14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050A14; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="width: 44px; height: 44px; border: 1px solid rgba(255,255,255,0.2); display: inline-block; text-align: center; line-height: 44px;">
                      <span style="color: white; font-weight: bold; font-size: 14px;">CS</span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="font-family: monospace; font-size: 10px; color: rgba(16, 185, 129, 0.7); text-transform: uppercase; letter-spacing: 2px;">
                      [CONNECTION: ACCEPTED]
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 0;">
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 16px 20px; margin-bottom: 24px; display: inline-block;">
                <span style="color: #10B981; font-size: 14px;">✓ Connection Accepted</span>
              </div>

              <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 400; color: white; font-family: Georgia, serif;">
                You're connected!
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.7);">
                Hey ${data.helperName}, great news! <strong style="color: white;">${data.founderName}</strong> has accepted your offer to help.
              </p>

              <!-- Founder Info -->
              <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); padding: 24px; margin: 24px 0;">
                <span style="font-family: monospace; font-size: 10px; color: rgba(16, 185, 129, 0.7); text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 16px;">
                  [FOUNDER DETAILS]
                </span>
                <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 500; color: white;">
                  ${data.founderName}
                </p>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: rgba(255,255,255,0.5);">
                  ${data.founderEmail}
                </p>

                <span style="font-family: monospace; font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 2px; display: block; margin: 16px 0 8px 0;">
                  [THEIR ASK]
                </span>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: rgba(255,255,255,0.6);">
                  "${data.askDescription}"
                </p>
              </div>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.7);">
                We recommend reaching out via LinkedIn to start the conversation.
              </p>

              <!-- LinkedIn Button -->
              ${data.founderLinkedIn ? `
              <a href="${data.founderLinkedIn}" style="display: inline-block; background: #0A66C2; color: white; padding: 14px 28px; text-decoration: none; font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">
                Connect on LinkedIn
              </a>
              ` : `
              <a href="mailto:${data.founderEmail}" style="display: inline-block; background: white; color: #050A14; padding: 14px 28px; text-decoration: none; font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">
                Send Email
              </a>
              `}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.3); font-family: monospace;">
                ChiStartup Hub • Chicago's Startup Ecosystem
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.2);">
                Thank you for supporting Chicago founders!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }),

  // When founder declines a connection request
  connectionDeclined: (data: {
    helperName: string;
    founderName: string;
    askDescription: string;
  }) => ({
    subject: `Update on your offer to help ${data.founderName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connection Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050A14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050A14; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="width: 44px; height: 44px; border: 1px solid rgba(255,255,255,0.2); display: inline-block; text-align: center; line-height: 44px;">
                      <span style="color: white; font-weight: bold; font-size: 14px;">CS</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 0;">
              <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 400; color: white; font-family: Georgia, serif;">
                Thanks for offering to help
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.7);">
                Hey ${data.helperName}, unfortunately ${data.founderName} has decided to go in a different direction for this particular ask.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.7);">
                This doesn't mean your offer wasn't valuable—founders often receive multiple offers and have to make tough choices based on specific fit.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.7);">
                There are many other founders in Chicago who could use your expertise. Keep exploring and connecting!
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 24px 0; border-top: 1px solid rgba(255,255,255,0.1);">
              <a href="https://chistartuphub.com/opportunities" style="display: inline-block; background: white; color: #050A14; padding: 14px 28px; text-decoration: none; font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">
                Explore More Asks
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.3); font-family: monospace;">
                ChiStartup Hub • Chicago's Startup Ecosystem
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }),
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, to, data } = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    if (!type || !to || !data) {
      throw new Error("Missing required fields: type, to, data");
    }

    // Get template based on type
    const template = templates[type as keyof typeof templates];
    if (!template) {
      throw new Error(`Unknown email type: ${type}`);
    }

    const emailContent = template(data);

    // Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log(`[EMAIL] Sent ${type} email to ${to}`, result);

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
