import { supabase } from '@/api/supabaseClient';

/**
 * Email Service
 * Sends emails via Supabase Edge Function + Resend
 */

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;

/**
 * Send an email using the edge function
 * @param {string} type - Email template type
 * @param {string} to - Recipient email address
 * @param {object} data - Template data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
async function sendEmail(type, to, data) {
  try {
    // Get current session for auth
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({ type, to, data }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[EMAIL] Failed to send:', result);
      return { success: false, error: result.error || 'Failed to send email' };
    }

    console.log('[EMAIL] Sent successfully:', type, to);
    return { success: true, id: result.id };
  } catch (error) {
    console.error('[EMAIL] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notify founder that their ask is being amplified
 */
export async function sendAmplificationEmail(founderEmail, data) {
  return sendEmail('amplification', founderEmail, {
    founderName: data.founderName,
    askDescription: data.askDescription,
    amplifiedAt: new Date().toISOString(),
  });
}

/**
 * Notify founder about a new connection request (someone wants to help)
 */
export async function sendConnectionRequestEmail(founderEmail, data) {
  return sendEmail('connectionRequest', founderEmail, {
    founderName: data.founderName,
    helperName: data.helperName,
    helperEmail: data.helperEmail,
    helperLinkedIn: data.helperLinkedIn,
    helperMessage: data.helperMessage,
    askDescription: data.askDescription,
  });
}

/**
 * Notify helper that their connection request was accepted
 */
export async function sendConnectionAcceptedEmail(helperEmail, data) {
  return sendEmail('connectionAccepted', helperEmail, {
    helperName: data.helperName,
    founderName: data.founderName,
    founderEmail: data.founderEmail,
    founderLinkedIn: data.founderLinkedIn,
    askDescription: data.askDescription,
  });
}

/**
 * Notify helper that their connection request was declined
 */
export async function sendConnectionDeclinedEmail(helperEmail, data) {
  return sendEmail('connectionDeclined', helperEmail, {
    helperName: data.helperName,
    founderName: data.founderName,
    askDescription: data.askDescription,
  });
}

export default {
  sendAmplificationEmail,
  sendConnectionRequestEmail,
  sendConnectionAcceptedEmail,
  sendConnectionDeclinedEmail,
};
