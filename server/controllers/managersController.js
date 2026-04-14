import bcrypt from 'bcryptjs';
import { User } from '../db.js';

const managerRoles = ['manager', 'hr_manager', 'operations_manager', 'area_manager'];

function mapManager(m) {
  return {
    id: m.id,
    name: m.name,
    username: m.username,
    dateOfBirth: m.date_of_birth,
    employeeCode: m.employee_code,
    startDate: m.start_date,
    payrollInfo: m.payroll_info,
    branch: m.branch,
    role: m.role,
    createdAt: m.created_at
  };
}

export async function createManager(req, res) {
  try {
    const { name, username, password, dateOfBirth, employeeCode, startDate, payrollInfo, branch, role, title, area } = req.body;

    if (!name || !username || !password || !dateOfBirth || !employeeCode || !startDate || !branch) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validRoles = ['manager', 'hr_manager', 'operations_manager', 'area_manager'];
    const validRole = validRoles.includes(role) ? role : 'manager';

    if (username === '2222' || username === '1111') {
      return res.status(400).json({ error: 'This username is not allowed' });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const existingCode = await User.findOne({ employee_code: employeeCode });
    if (existingCode) {
      return res.status(400).json({ error: 'Employee code already exists' });
    }

    if (title === 'Branch Manager' && branch) {
      const existingBranchManager = await User.findOne({
        title: 'Branch Manager',
        branch,
        $or: [{ status: 'active' }, { status: null }]
      });
      if (existingBranchManager) {
        return res.status(400).json({
          error: `Branch ${branch} already has a Branch Manager (${existingBranchManager.name}). Each branch can only have one Branch Manager.`
        });
      }
    }

    if (title === 'Area Manager' && area) {
      const existingAreaManager = await User.findOne({
        title: 'Area Manager',
        area,
        $or: [{ status: 'active' }, { status: null }]
      });
      if (existingAreaManager) {
        return res.status(400).json({
          error: `Area ${area} already has an Area Manager (${existingAreaManager.name}). Each area can only have one Area Manager.`
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const manager = await User.create({
      name,
      username,
      password: hashedPassword,
      date_of_birth: dateOfBirth,
      employee_code: employeeCode,
      start_date: startDate,
      payroll_info: payrollInfo || '',
      branch,
      role: validRole,
      title: title || undefined,
      area: area || undefined
    });

    res.status(201).json({
      id: manager.id,
      name: manager.name,
      username: manager.username,
      dateOfBirth: manager.date_of_birth,
      employeeCode: manager.employee_code,
      startDate: manager.start_date,
      payrollInfo: manager.payroll_info,
      branch: manager.branch,
      role: manager.role
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username or employee code already exists' });
    }
    console.error('POST /api/managers error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}

export async function getManagers(req, res) {
  try {
    const managers = await User.find({ role: { $in: managerRoles } })
      .sort({ role: 1, created_at: -1 })
      .select('name username date_of_birth employee_code start_date payroll_info branch role created_at');
    res.json(managers.map(mapManager));
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
}

export async function getManagerById(req, res) {
  try {
    const manager = await User.findOne({
      _id: req.params.id,
      role: { $in: managerRoles }
    }).select('name username date_of_birth employee_code start_date payroll_info branch role created_at');

    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }
    res.json(mapManager(manager));
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
}

export async function updateManager(req, res) {
  try {
    const { name, username, password, dateOfBirth, employeeCode, startDate, payrollInfo, branch, role } = req.body;

    if (username && (username === '2222' || username === '1111')) {
      return res.status(400).json({ error: 'This username is not allowed' });
    }

    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    const updateData = {
      name,
      date_of_birth: dateOfBirth,
      employee_code: employeeCode,
      start_date: startDate,
      payroll_info: payrollInfo || '',
      branch
    };
    if (username) updateData.username = username;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (role && ['manager', 'hr_manager', 'operations_manager', 'area_manager'].includes(role)) {
      updateData.role = role;
    }

    const manager = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $in: managerRoles } },
      updateData,
      { new: true }
    );

    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    console.error('PUT /api/managers/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function deleteManager(req, res) {
  try {
    const result = await User.deleteOne({
      _id: req.params.id,
      role: { $in: managerRoles }
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ message: 'Profile deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete profile' });
  }
}
