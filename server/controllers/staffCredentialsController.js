import crypto from 'crypto';
import { User } from '../db.js';
import { logActivity } from '../utils/activityLogger.js';

const DISALLOWED_USERNAMES = new Set(['1111', '2222']);

function slugifyName(name) {
  if (!name || typeof name !== 'string') return 'user';
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28);
  return s.length >= 2 ? s : 'user';
}

function baseFromEmployeeCode(code) {
  if (!code || typeof code !== 'string') return null;
  const s = code.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s.length < 2) return null;
  return s.slice(0, 32);
}

async function ensureUniqueUsername(base) {
  let candidate = base;
  let n = 2;
  while (await User.findOne({ username: candidate }).select('_id').lean()) {
    candidate = `${base}-${n}`;
    n += 1;
    if (n > 5000) {
      throw new Error('Could not allocate a unique username');
    }
  }
  return candidate;
}

/**
 * Owner-only: propose a unique username and strong random password (not persisted).
 */
export async function generateCredentials(req, res) {
  try {
    const { name, employeeCode } = req.body;

    const nameStr = typeof name === 'string' ? name.trim() : '';
    const codeStr = typeof employeeCode === 'string' ? employeeCode.trim() : '';

    if (!nameStr || !codeStr) {
      return res.status(400).json({ error: 'Name and employee code are required to generate credentials' });
    }

    const codeBase = baseFromEmployeeCode(codeStr);
    let base = codeBase || slugifyName(nameStr);

    if (DISALLOWED_USERNAMES.has(base) || base.length < 2) {
      base = `${slugifyName(nameStr)}-${(codeBase || 'u').slice(0, 8)}`;
    }
    if (base.length < 2) base = 'staff';

    let username = await ensureUniqueUsername(base);
    if (DISALLOWED_USERNAMES.has(username)) {
      username = await ensureUniqueUsername(`${base}-x`);
    }

    const password = crypto.randomBytes(18).toString('base64url');

    const actor = await User.findById(req.user.id).select('name branch');
    await logActivity(
      req.user.id,
      actor?.name,
      req.user.role,
      'credentials_generated',
      'Generated employee login credentials (username allocated; password not logged)',
      actor?.branch,
      { employeeCode: codeStr }
    );

    res.json({ username, password });
  } catch (e) {
    console.error('generateCredentials:', e);
    return res.status(500).json({ error: 'Failed to generate credentials' });
  }
}
