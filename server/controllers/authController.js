import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../db.js';
import { logActivity } from '../utils/activityLogger.js';
import { JWT_SECRET } from '../middleware.js';

export async function login(req, res) {
  try {
    const { email, username, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const query = email ? { email } : { username };
    const identifier = email || username;

    if (!identifier) {
      return res.status(400).json({ error: 'Email or username is required' });
    }

    try {
      const user = await User.findOne(query);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

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
      } catch (logError) {
        console.error('Failed to log login activity:', logError);
      }

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          branch: user.branch || null,
          employeeCode: user.employee_code || null,
          area: user.area || null
        }
      });
    } catch (dbError) {
      console.error('Database error in login:', dbError);
      return res.status(500).json({ error: 'Database error: ' + dbError.message });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select('id name username email role employee_code date_of_birth start_date payroll_info branch area');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      employeeCode: user.employee_code,
      dateOfBirth: user.date_of_birth,
      startDate: user.start_date,
      payrollInfo: user.payroll_info,
      branch: user.branch,
      area: user.area
    });
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
}
