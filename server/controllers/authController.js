import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mongoose, User } from '../db.js';
import { logActivity } from '../utils/activityLogger.js';
import { JWT_SECRET } from '../middleware.js';
import {
  PASSWORD_RESET_TTL_MS,
  hashPasswordResetToken,
  generatePasswordResetToken,
  buildPasswordResetUrl,
  canIssuePasswordResetLink,
  safeEqualHex,
} from '../utils/passwordReset.js';

const PUBLIC_CLIENT_URL = process.env.PUBLIC_CLIENT_URL || '';
const GENERIC_RESET_ERROR = 'Invalid or expired reset link';

export async function login(req, res) {
  const requestStart = Date.now();
  console.log('[Login Server] Request received');
  
  try {
    const { username, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const idEmail = typeof email === 'string' ? email.trim() : '';
    const idUsername = typeof username === 'string' ? username.trim() : '';
    const loginId = idEmail || idUsername;

    if (!loginId) {
      return res.status(400).json({ error: 'Username or email is required' });
    }

    try {
      const isEmail = loginId.includes('@');
      console.log(`[Login Server] Looking up user by ${isEmail ? 'email' : 'username'}...`);
      
      const dbQueryStart = Date.now();
      const user = isEmail
        ? await User.findOne({ email: loginId.toLowerCase() })
        : await User.findOne({ username: loginId });
      const dbQueryTime = Date.now() - dbQueryStart;
      console.log(`[Login Server] Database query completed in ${dbQueryTime}ms`);

      if (!user) {
        console.log(`[Login Server] User not found (${Date.now() - requestStart}ms)`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.password) {
        console.log(`[Login Server] User has no password (${Date.now() - requestStart}ms)`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log('[Login Server] Comparing password...');
      const bcryptStart = Date.now();
      const validPassword = await bcrypt.compare(password, user.password);
      const bcryptTime = Date.now() - bcryptStart;
      console.log(`[Login Server] Password comparison completed in ${bcryptTime}ms`);
      
      if (!validPassword) {
        console.log(`[Login Server] Invalid password (${Date.now() - requestStart}ms)`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log('[Login Server] Generating JWT token...');
      const jwtStart = Date.now();
      const token = jwt.sign(
        { id: user._id.toString(), username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      const jwtTime = Date.now() - jwtStart;
      console.log(`[Login Server] JWT generated in ${jwtTime}ms`);

      console.log('[Login Server] Logging activity...');
      const logStart = Date.now();
      try {
        await logActivity(
          user._id,
          user.name,
          user.role,
          'login',
          `${user.name} logged in`,
          user.branch,
          { username: user.username }
        );
        const logTime = Date.now() - logStart;
        console.log(`[Login Server] Activity logged in ${logTime}ms`);
      } catch (logError) {
        const logTime = Date.now() - logStart;
        console.error(`[Login Server] Failed to log activity (${logTime}ms):`, logError);
      }

      const totalTime = Date.now() - requestStart;
      console.log(`[Login Server] Login successful - Total time: ${totalTime}ms`);
      console.log(`[Login Server] Breakdown: DB=${dbQueryTime}ms, bcrypt=${bcryptTime}ms, JWT=${jwtTime}ms`);

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          branch: user.branch || null,
          employeeCode: user.employee_code || null,
          area: user.area || null,
          mustChangePassword: !!user.must_change_password,
        },
      });
    } catch (dbError) {
      console.error(`[Login Server] Database error (${Date.now() - requestStart}ms):`, dbError);
      return res.status(500).json({ error: 'Database error: ' + dbError.message });
    }
  } catch (error) {
    console.error(`[Login Server] Login error (${Date.now() - requestStart}ms):`, error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select(
      'id name username role employee_code date_of_birth start_date payroll_info branch area must_change_password'
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      employeeCode: user.employee_code,
      dateOfBirth: user.date_of_birth,
      startDate: user.start_date,
      payrollInfo: user.payroll_info,
      branch: user.branch,
      area: user.area,
      mustChangePassword: !!user.must_change_password,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (typeof newPassword !== 'string' || newPassword.length === 0) {
      return res.status(400).json({ error: 'New password is required' });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    const user = await User.findById(req.user.id).select(
      'password name role branch username must_change_password'
    );
    if (!user || !user.password) {
      return res.status(400).json({ error: 'Cannot change password for this account' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.must_change_password = false;
    await user.save();

    try {
      await logActivity(
        user._id,
        user.name,
        user.role,
        'password_changed',
        `${user.name} changed their password`,
        user.branch,
        {}
      );
    } catch (e) {
      console.error('logActivity password_changed:', e);
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('changePassword:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function issuePasswordResetLink(req, res) {
  try {
    const { userId } = req.body;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const target = await User.findById(userId).select(
      'role status password name branch'
    );
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!canIssuePasswordResetLink(req.user.role, target)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (target.status !== 'active') {
      return res.status(400).json({ error: 'Cannot issue reset link for inactive user' });
    }
    if (!target.password) {
      return res.status(400).json({ error: 'Cannot issue reset link for this account' });
    }

    const rawToken = generatePasswordResetToken();
    const hash = hashPasswordResetToken(rawToken);
    const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    target.password_reset_token_hash = hash;
    target.password_reset_expires = expires;
    await target.save();

    let resetUrl;
    try {
      resetUrl = buildPasswordResetUrl(PUBLIC_CLIENT_URL, rawToken);
    } catch (e) {
      console.error('buildPasswordResetUrl:', e.message);
      return res.status(500).json({ error: 'Server is not configured for password reset links' });
    }

    try {
      const actor = await User.findById(req.user.id).select('name branch');
      await logActivity(
        req.user.id,
        actor?.name,
        req.user.role,
        'password_reset_link_issued',
        `Password reset link issued for ${target.name}`,
        actor?.branch,
        { targetUserId: target._id.toString() }
      );
    } catch (e) {
      console.error('logActivity password_reset_link_issued:', e);
    }

    res.json({
      resetUrl,
      expiresAt: expires.toISOString(),
    });
  } catch (err) {
    console.error('issuePasswordResetLink:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function resetPasswordWithToken(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: GENERIC_RESET_ERROR });
    }
    if (typeof newPassword !== 'string' || newPassword.length === 0) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const hash = hashPasswordResetToken(token.trim());
    const user = await User.findOne({
      password_reset_token_hash: hash,
    }).select(
      'password_reset_token_hash password_reset_expires password name role branch username'
    );

    if (
      !user ||
      !user.password_reset_expires ||
      user.password_reset_expires.getTime() <= Date.now()
    ) {
      return res.status(400).json({ error: GENERIC_RESET_ERROR });
    }

    if (!safeEqualHex(user.password_reset_token_hash, hash)) {
      return res.status(400).json({ error: GENERIC_RESET_ERROR });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.password_reset_token_hash = null;
    user.password_reset_expires = null;
    user.must_change_password = false;
    await user.save();

    try {
      await logActivity(
        user._id,
        user.name,
        user.role,
        'password_reset_completed',
        `${user.name} reset password via link`,
        user.branch,
        {}
      );
    } catch (e) {
      console.error('logActivity password_reset_completed:', e);
    }

    res.json({ message: 'Password updated successfully. You can log in.' });
  } catch (err) {
    console.error('resetPasswordWithToken:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
