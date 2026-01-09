import { describe, it, expect } from 'vitest';
import { ADMIN_EMAILS, isAdminEmail } from '@/constants/adminEmails';

describe('adminEmails', () => {
  describe('ADMIN_EMAILS constant', () => {
    it('contains expected admin emails', () => {
      expect(ADMIN_EMAILS).toContain('admin@test.chistartuphub.com');
      expect(ADMIN_EMAILS).toContain('hello@chistartuphub.com');
      expect(ADMIN_EMAILS).toContain('billy@chistartuphub.com');
    });

    it('has exactly 3 admin emails', () => {
      expect(ADMIN_EMAILS).toHaveLength(3);
    });
  });

  describe('isAdminEmail function', () => {
    it('returns true for admin emails', () => {
      expect(isAdminEmail('admin@test.chistartuphub.com')).toBe(true);
      expect(isAdminEmail('hello@chistartuphub.com')).toBe(true);
      expect(isAdminEmail('billy@chistartuphub.com')).toBe(true);
    });

    it('returns false for non-admin emails', () => {
      expect(isAdminEmail('user@example.com')).toBe(false);
      expect(isAdminEmail('random@chistartuphub.com')).toBe(false);
    });

    it('returns falsy for null or undefined', () => {
      // Function returns falsy values (null/undefined) for invalid inputs
      expect(isAdminEmail(null)).toBeFalsy();
      expect(isAdminEmail(undefined)).toBeFalsy();
      expect(isAdminEmail('')).toBeFalsy();
    });

    it('is case-insensitive', () => {
      // Function lowercases input before checking
      expect(isAdminEmail('ADMIN@TEST.CHISTARTUPHUB.COM')).toBe(true);
      expect(isAdminEmail('Hello@ChiStartupHub.com')).toBe(true);
    });
  });
});
