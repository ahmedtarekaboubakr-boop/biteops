import crypto from 'crypto';

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export function hashPasswordResetToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

export function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function buildPasswordResetUrl(baseUrl, token) {
  const trimmed = typeof baseUrl === 'string' ? baseUrl.trim().replace(/\/+$/, '') : '';
  if (!trimmed) {
    throw new Error('PUBLIC_CLIENT_URL is not configured');
  }
  const u = new URL(trimmed);
  u.pathname = '/reset-password';
  u.search = '';
  u.searchParams.set('token', token);
  return u.toString();
}

/**
 * Owner may issue for any user; HR manager only for staff.
 */
export function canIssuePasswordResetLink(issuerRole, targetUser) {
  if (!targetUser) return false;
  if (issuerRole === 'owner') return true;
  if (issuerRole === 'hr_manager' && targetUser.role === 'staff') return true;
  return false;
}

export function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
