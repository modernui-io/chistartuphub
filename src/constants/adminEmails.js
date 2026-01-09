/**
 * Admin email addresses
 *
 * This list must match the is_admin() database function in:
 * supabase/migrations/20260105000000_security_fixes.sql
 *
 * When updating this list, also update the database function.
 */
export const ADMIN_EMAILS = [
  'admin@test.chistartuphub.com',
  'hello@chistartuphub.com',
  'billy@chistartuphub.com',
];

/**
 * Check if an email address belongs to an admin
 * @param {string} email - Email to check
 * @returns {boolean} - True if admin
 */
export const isAdminEmail = (email) => {
  return email && ADMIN_EMAILS.includes(email.toLowerCase());
};
