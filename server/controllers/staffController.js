import bcrypt from 'bcryptjs';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { User, EmploymentHistory, StaffLeaveBalance, Schedule, Rating, AttendanceRecord, LeaveRequest, Penalty } from '../db.js';
import { logActivity } from '../utils/activityLogger.js';
import { getAreaManagerBranches } from '../utils/getAreaManagerBranches.js';
import { hasHRPrivileges } from '../utils/roleHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function mapStaffResponse(s, balance = null) {
  return {
    id: s.id || s._id?.toString(),
    name: s.name,
    username: s.username,
    dateOfBirth: s.date_of_birth,
    employeeCode: s.employee_code,
    title: s.title,
    phoneNumber: s.phone_number,
    idNumber: s.id_number,
    startDate: s.start_date,
    payrollInfo: s.payroll_info,
    branch: s.branch,
    role: s.role,
    status: s.status || 'active',
    createdAt: s.created_at,
    photo: s.photo,
    salary: s.salary,
    healthCertificate: s.health_certificate,
    totalLeaveDays: balance?.total_leave_days ?? 0,
    area: s.area
  };
}

export async function uploadPhoto(req, res) {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }
    const staff = await User.findById(id).select('photo');
    if (!staff) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Staff not found' });
    }
    if (staff.photo && fs.existsSync(join(__dirname, '..', staff.photo))) {
      fs.unlinkSync(join(__dirname, '..', staff.photo));
    }
    const photoPath = `/uploads/photos/${req.file.filename}`;
    await User.findByIdAndUpdate(id, { photo: photoPath });
    res.json({ photo: photoPath, message: 'Photo uploaded successfully' });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('POST /api/staff/:id/photo error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function uploadHealthCertificate(req, res) {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'No certificate file provided' });
    }
    const staff = await User.findById(id).select('health_certificate');
    if (!staff) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Staff not found' });
    }
    if (staff.health_certificate && fs.existsSync(join(__dirname, '..', staff.health_certificate))) {
      fs.unlinkSync(join(__dirname, '..', staff.health_certificate));
    }
    const certificatePath = `/uploads/certificates/${req.file.filename}`;
    await User.findByIdAndUpdate(id, { health_certificate: certificatePath });
    res.json({ healthCertificate: certificatePath, message: 'Health certificate uploaded successfully' });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('POST /api/staff/:id/health-certificate error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function createStaff(req, res) {
  try {
    let {
      name,
      username,
      password,
      dateOfBirth,
      employeeCode,
      title,
      phoneNumber,
      idNumber,
      startDate,
      payrollInfo,
      branch,
      salary,
      totalLeaveDays,
      area,
      mustChangePassword,
    } = req.body;

    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      branch = manager.branch;
    }

    const isAreaManager = title === 'Area Manager';
    const requiredFields = !name || !username || !password || !dateOfBirth || !employeeCode || !title || !phoneNumber || !idNumber || !startDate;
    const branchRequired = !isAreaManager && !branch;
    if (requiredFields || branchRequired) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (isAreaManager && !area) {
      return res.status(400).json({ error: 'Area is required when selecting Area Manager as title' });
    }
    if (isAreaManager) branch = null;
    if (area && !['Fifth Settlement', '6th of October'].includes(area)) {
      return res.status(400).json({ error: 'Area must be either "Fifth Settlement" or "6th of October"' });
    }
    if (username === '2222' || username === '1111') {
      return res.status(400).json({ error: 'This username is not allowed' });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    const existingCode = await User.findOne({ employee_code: employeeCode });
    if (existingCode) return res.status(400).json({ error: 'Employee code already exists' });

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
    let role = 'staff';
    if (title === 'Branch Manager') role = 'manager';
    else if (title === 'Area Manager') role = 'area_manager';
    else if (title === 'Operations Manager') role = 'operations_manager';

    const setMustChange = req.user.role === 'owner' && !!mustChangePassword;

    const staff = await User.create({
      name,
      username,
      password: hashedPassword,
      date_of_birth: dateOfBirth,
      employee_code: employeeCode,
      title,
      phone_number: phoneNumber,
      id_number: idNumber,
      start_date: startDate,
      payroll_info: payrollInfo || '',
      branch: branch || null,
      role,
      salary: salary || null,
      area: area || null,
      must_change_password: setMustChange,
    });

    if (title) {
      await EmploymentHistory.create({
        staff_id: staff._id,
        new_title: title,
        change_date: startDate || new Date().toISOString().split('T')[0],
        change_type: 'promotion',
        changed_by: req.user.id
      });
    }

    const hrUser = await User.findById(req.user.id).select('name');
    await logActivity(
      req.user.id,
      hrUser?.name || 'HR',
      req.user.role,
      'staff_created',
      `Created new staff profile: ${name} (${title || 'Staff'}) at ${branch || 'Unassigned'}`,
      branch,
      { staffName: name, title, employeeCode }
    );

    let totalLeaveDaysVal = 0;
    if (req.body.totalLeaveDays) {
      totalLeaveDaysVal = parseInt(req.body.totalLeaveDays) || 0;
      await StaffLeaveBalance.create({
        staff_id: staff._id,
        total_leave_days: totalLeaveDaysVal,
        used_leave_days: 0,
        remaining_leave_days: totalLeaveDaysVal
      });
    }

    res.status(201).json(mapStaffResponse(staff, { total_leave_days: totalLeaveDaysVal }));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username or employee code already exists' });
    }
    console.error('POST /api/staff error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}

export async function getStaff(req, res) {
  try {
    const { status } = req.query;
    const showInactive = hasHRPrivileges(req.user.role) && status === 'all';
    const match = { role: { $in: ['staff', 'manager', 'area_manager', 'operations_manager'] } };

    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      const areaManagerCodes = [];
      if (['Leven', 'Sodic Villete', 'Sodic', 'Mivida'].includes(manager.branch)) areaManagerCodes.push('1663');
      if (['Arkan', 'Palm Hills'].includes(manager.branch)) areaManagerCodes.push('1618');
      const branchOr = [
        { branch: manager.branch },
        { title: 'Operations Manager' }
      ];
      if (areaManagerCodes.length > 0) {
        branchOr.push({ title: 'Area Manager', employee_code: { $in: areaManagerCodes } });
      }
      match.$or = branchOr;
      if (!showInactive) {
        match.status = { $in: ['active', null] };
      }
    } else if (req.user.role === 'area_manager') {
      const areaManager = await User.findById(req.user.id).select('area');
      const assignedBranches = getAreaManagerBranches(areaManager?.area);
      if (assignedBranches.length > 0) {
        match.branch = { $in: assignedBranches };
      }
      if (!showInactive) {
        match.status = { $in: ['active', null] };
      }
    } else {
      if (!showInactive) {
        match.status = { $in: ['active', null] };
      }
    }

    const staff = await User.find(match).sort({ created_at: -1 }).lean();
    const staffWithBalances = await Promise.all(staff.map(async (s) => {
      const balance = await StaffLeaveBalance.findOne({ staff_id: s._id }).select('total_leave_days');
      return mapStaffResponse(s, balance);
    }));
    res.json(staffWithBalances);
  } catch (error) {
    console.error('GET /api/staff error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getStaffById(req, res) {
  try {
    if (req.user.role === 'staff') {
      if (req.params.id !== req.user.id) {
        return res.status(403).json({ error: 'You can only view your own information' });
      }
    } else if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      const staffMember = await User.findOne({ _id: req.params.id, role: 'staff' }).select('branch');
      if (!staffMember) return res.status(404).json({ error: 'Staff not found' });
      if (staffMember.branch !== manager.branch) {
        return res.status(403).json({ error: 'Access denied. You can only view staff from your branch.' });
      }
    } else if (!['owner', 'hr_manager', 'area_manager', 'operations_manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const staff = await User.findOne({
      _id: req.params.id,
      role: { $in: ['staff', 'manager', 'area_manager', 'operations_manager'] }
    });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    const balance = await StaffLeaveBalance.findOne({ staff_id: staff._id }).select('total_leave_days');
    res.json(mapStaffResponse(staff, balance));
  } catch (error) {
    console.error('GET /api/staff/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function updateStaff(req, res) {
  try {
    let { name, username, password, dateOfBirth, employeeCode, title, phoneNumber, idNumber, startDate, payrollInfo, branch, salary, totalLeaveDays, area } = req.body;
    const staffId = req.params.id;

    const currentStaff = await User.findById(staffId).select('title branch');
    if (!currentStaff) return res.status(404).json({ error: 'Staff not found' });

    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) return res.status(400).json({ error: 'Manager branch not found' });
      const staffMember = await User.findOne({ _id: staffId, role: 'staff' }).select('branch');
      if (!staffMember) return res.status(404).json({ error: 'Staff not found' });
      if (staffMember.branch !== manager.branch) {
        return res.status(403).json({ error: 'Access denied. You can only update staff from your branch.' });
      }
      branch = manager.branch;
    }

    if (username && (username === '2222' || username === '1111')) {
      return res.status(400).json({ error: 'This username is not allowed' });
    }
    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: staffId } });
      if (existing) return res.status(400).json({ error: 'Username already exists' });
    }

    const isAreaManager = title === 'Area Manager';
    if (isAreaManager && !area) return res.status(400).json({ error: 'Area is required when selecting Area Manager as title' });
    if (area && !['Fifth Settlement', '6th of October'].includes(area)) {
      return res.status(400).json({ error: 'Area must be either "Fifth Settlement" or "6th of October"' });
    }

    if (title === 'Branch Manager' && branch) {
      const existingBranchManager = await User.findOne({
        title: 'Branch Manager',
        branch,
        $or: [{ status: 'active' }, { status: null }],
        _id: { $ne: staffId }
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
        $or: [{ status: 'active' }, { status: null }],
        _id: { $ne: staffId }
      });
      if (existingAreaManager) {
        return res.status(400).json({
          error: `Area ${area} already has an Area Manager (${existingAreaManager.name}). Each area can only have one Area Manager.`
        });
      }
    }

    let role = 'staff';
    if (title === 'Branch Manager') role = 'manager';
    else if (title === 'Area Manager') role = 'area_manager';
    else if (title === 'Operations Manager') role = 'operations_manager';
    if (isAreaManager) branch = null;

    const updateData = {
      name,
      date_of_birth: dateOfBirth,
      employee_code: employeeCode,
      title,
      phone_number: phoneNumber || '',
      id_number: idNumber || '',
      start_date: startDate,
      payroll_info: payrollInfo || '',
      branch: branch || null,
      role,
      salary: salary || null,
      area: area || null
    };
    if (username) updateData.username = username;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const staff = await User.findOneAndUpdate(
      { _id: staffId, role: { $in: ['staff', 'manager', 'area_manager', 'operations_manager'] } },
      updateData,
      { new: true }
    );
    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    if (title && title !== currentStaff.title) {
      await EmploymentHistory.create({
        staff_id: staffId,
        previous_title: currentStaff.title,
        new_title: title,
        change_date: new Date().toISOString().split('T')[0],
        change_type: 'promotion',
        changed_by: req.user.id
      });
    }

    if (totalLeaveDays !== undefined) {
      const leaveDays = parseInt(totalLeaveDays) || 0;
      let balance = await StaffLeaveBalance.findOne({ staff_id: staffId });
      if (balance) {
        const newRemaining = leaveDays - balance.used_leave_days;
        await StaffLeaveBalance.findByIdAndUpdate(balance._id, {
          total_leave_days: leaveDays,
          remaining_leave_days: newRemaining,
          updated_at: new Date()
        });
      } else {
        await StaffLeaveBalance.create({
          staff_id: staffId,
          total_leave_days: leaveDays,
          used_leave_days: 0,
          remaining_leave_days: leaveDays
        });
      }
    }

    res.json({ message: 'Staff updated successfully' });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Username or employee code already exists' });
    console.error('PUT /api/staff/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function deleteStaff(req, res) {
  try {
    const staffId = req.params.id;
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) return res.status(400).json({ error: 'Manager branch not found' });
      const staffMember = await User.findOne({ _id: staffId, role: 'staff' }).select('branch');
      if (!staffMember) return res.status(404).json({ error: 'Staff not found' });
      if (staffMember.branch !== manager.branch) {
        return res.status(403).json({ error: 'Access denied. You can only deactivate staff from your branch.' });
      }
    }

    const staffMember = await User.findById(staffId).select('name branch title role');
    if (!staffMember) return res.status(404).json({ error: 'Staff not found' });
    if (!['staff', 'manager', 'area_manager', 'operations_manager'].includes(staffMember.role)) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    await User.findByIdAndUpdate(staffId, { status: 'inactive' });

    await EmploymentHistory.create({
      staff_id: staffId,
      previous_title: staffMember.title || null,
      new_title: 'Left',
      change_date: new Date().toISOString().split('T')[0],
      change_type: 'deactivation',
      notes: `Deactivated on ${new Date().toISOString().split('T')[0]}`,
      changed_by: req.user.id
    });

    const hrUser = await User.findById(req.user.id).select('name');
    await logActivity(
      req.user.id,
      hrUser?.name || 'HR',
      req.user.role,
      'staff_deactivated',
      `Deactivated staff: ${staffMember.name} (${staffMember.branch || 'N/A'})`,
      staffMember.branch || null,
      { staffId, staffName: staffMember.name }
    );

    res.json({ message: 'Staff deactivated successfully' });
  } catch (error) {
    console.error('DELETE /api/staff error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getEmploymentHistory(req, res) {
  try {
    const { id } = req.params;
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      const staff = await User.findById(id).select('branch');
      if (staff && staff.branch !== manager?.branch) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const history = await EmploymentHistory.find({ staff_id: id })
      .populate('changed_by', 'name')
      .sort({ change_date: -1, created_at: -1 })
      .lean();

    const staffInfo = await User.findById(id).select('branch start_date');
    let manOfTheMonthCount = 0;
    if (staffInfo?.branch) {
      const start = staffInfo.start_date ? new Date(staffInfo.start_date) : new Date();
      const end = new Date();
      let current = new Date(start.getFullYear(), start.getMonth(), 1);
      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
      while (current <= endMonth) {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        const monthStartStr = monthStart.toISOString().split('T')[0];
        const monthEndStr = monthEnd.toISOString().split('T')[0];

        const branchStaff = await User.find({
          branch: staffInfo.branch,
          role: 'staff',
          $or: [{ status: 'active' }, { status: null }]
        }).select('_id name employee_code').lean();

        const monthlyLeaderboard = [];
        for (const sm of branchStaff) {
          const ratings = await Rating.aggregate([
            { $match: { staff_id: sm._id, date: { $gte: monthStartStr, $lte: monthEndStr } } },
            { $group: { _id: null, avg_performance: { $avg: '$performance' }, rating_count: { $sum: 1 } } }
          ]);
          const r = ratings[0];
          if (r && r.rating_count > 0 && r.avg_performance != null) {
            monthlyLeaderboard.push({ staff_id: sm._id.toString(), avg_performance: r.avg_performance });
          }
        }
        monthlyLeaderboard.sort((a, b) => b.avg_performance - a.avg_performance);
        if (monthlyLeaderboard.length > 0 && monthlyLeaderboard[0].staff_id === id) {
          manOfTheMonthCount++;
        }
        current.setMonth(current.getMonth() + 1);
      }
    }
    res.json({
      history: history.map(h => ({
        ...h,
        id: h._id.toString(),
        changed_by_name: h.changed_by?.name
      })),
      manOfTheMonthCount
    });
  } catch (error) {
    console.error('GET /api/staff/:id/employment-history error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function addEmploymentHistory(req, res) {
  try {
    const { id } = req.params;
    const { previousTitle, newTitle, changeDate, changeType, notes } = req.body;
    if (!newTitle || !changeDate) {
      return res.status(400).json({ error: 'newTitle and changeDate are required' });
    }
    const staff = await User.findById(id);
    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    const entry = await EmploymentHistory.create({
      staff_id: id,
      previous_title: previousTitle || null,
      new_title: newTitle,
      change_date: changeDate,
      change_type: changeType || 'promotion',
      notes: notes || null,
      changed_by: req.user.id
    });
    res.status(201).json({ id: entry.id, message: 'Employment history entry added successfully' });
  } catch (error) {
    console.error('POST /api/staff/:id/employment-history error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function reactivateStaff(req, res) {
  try {
    const staffMember = await User.findById(req.params.id).select('name branch role');
    if (!staffMember) return res.status(404).json({ error: 'Staff not found' });
    if (!['staff', 'manager', 'area_manager', 'operations_manager'].includes(staffMember.role)) {
      return res.status(403).json({ error: 'Cannot reactivate this user' });
    }
    await User.findByIdAndUpdate(req.params.id, { status: 'active' });
    const hrUser = await User.findById(req.user.id).select('name');
    await logActivity(
      req.user.id,
      hrUser?.name || 'HR',
      req.user.role,
      'staff_reactivated',
      `Reactivated staff: ${staffMember.name} (${staffMember.branch || 'N/A'})`,
      staffMember.branch || null,
      { staffId: req.params.id, staffName: staffMember.name }
    );
    res.json({ message: 'Staff reactivated successfully' });
  } catch (error) {
    console.error('PUT /api/staff/:id/reactivate error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getMySchedule(req, res) {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ error: 'Access denied' });
    const { startDate, endDate } = req.query;
    const match = { staff_id: req.user.id };
    if (startDate) match.date = { ...match.date, $gte: startDate };
    if (endDate) match.date = { ...match.date, $lte: endDate };
    const schedules = await Schedule.find(match)
      .populate('staff_id', 'name employee_code title')
      .sort({ date: 1, shift: 1 })
      .lean();
    res.json(schedules.map(s => ({
      ...s,
      id: s._id.toString(),
      staff_name: s.staff_id?.name,
      employee_code: s.staff_id?.employee_code,
      title: s.staff_id?.title
    })) || []);
  } catch (error) {
    console.error('GET /api/staff/my-schedule error:', error);
    return res.status(500).json({ error: 'Internal server error: ' });
  }
}

export async function getMyRatings(req, res) {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ error: 'Access denied' });
    const { startDate, endDate } = req.query;
    const match = { staff_id: req.user.id };
    if (startDate) match.date = { ...match.date, $gte: startDate };
    if (endDate) match.date = { ...match.date, $lte: endDate };
    const ratings = await Rating.find(match)
      .populate('manager_id', 'name')
      .sort({ date: -1 })
      .lean();
    res.json(ratings.map(r => ({
      ...r,
      id: r._id.toString(),
      manager_name: r.manager_id?.name
    })) || []);
  } catch (error) {
    console.error('GET /api/staff/my-ratings error:', error);
    return res.status(500).json({ error: 'Internal server error: ' });
  }
}

export async function getMyAttendance(req, res) {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ error: 'Access denied' });
    const { startDate, endDate } = req.query;
    const match = { staff_id: req.user.id };
    if (startDate) match.date = { ...match.date, $gte: startDate };
    if (endDate) match.date = { ...match.date, $lte: endDate };
    const records = await AttendanceRecord.find(match).sort({ date: -1 });
    res.json(records || []);
  } catch (error) {
    console.error('GET /api/staff/my-attendance error:', error);
    return res.status(500).json({ error: 'Internal server error: ' });
  }
}

export async function getMyRequests(req, res) {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ error: 'Access denied' });
    const requests = await LeaveRequest.find({ staff_id: req.user.id })
      .populate('staff_id', 'name')
      .populate('manager_id', 'name')
      .populate('hr_manager_id', 'name')
      .sort({ created_at: -1 })
      .lean();
    res.json(requests.map(r => ({
      ...r,
      id: r._id.toString(),
      staff_name: r.staff_id?.name,
      manager_name: r.manager_id?.name,
      hr_name: r.hr_manager_id?.name
    })) || []);
  } catch (error) {
    console.error('Get staff requests error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}

export async function getMyPenalties(req, res) {
  try {
    if (req.user.role !== 'staff') return res.status(403).json({ error: 'Access denied' });
    const penalties = await Penalty.find({ staff_id: req.user.id })
      .populate('staff_id', 'name')
      .populate('manager_id', 'name')
      .sort({ date: -1, created_at: -1 })
      .lean();
    res.json(penalties.map(p => ({
      ...p,
      id: p._id.toString(),
      staff_name: p.staff_id?.name,
      manager_name: p.manager_id?.name
    })) || []);
  } catch (error) {
    console.error('Get staff penalties error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}

export async function getLeaveBalance(req, res) {
  try {
    const { id } = req.params;
    if (req.user.role === 'staff') {
      if (id !== req.user.id) {
        return res.status(403).json({ error: 'You can only view your own leave balance' });
      }
    } else if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      const staff = await User.findOne({ _id: id, role: 'staff' }).select('branch');
      if (!staff) return res.status(404).json({ error: 'Staff not found' });
      if (staff.branch !== manager?.branch) return res.status(403).json({ error: 'Access denied' });
    }
    let balance = await StaffLeaveBalance.findOne({ staff_id: id });
    if (!balance) {
      balance = await StaffLeaveBalance.create({
        staff_id: id,
        total_leave_days: 20,
        used_leave_days: 0,
        remaining_leave_days: 20
      });
    }
    res.json({
      id: balance.id,
      staff_id: balance.staff_id?.toString(),
      total_leave_days: balance.total_leave_days,
      used_leave_days: balance.used_leave_days,
      remaining_leave_days: balance.remaining_leave_days,
      updated_at: balance.updated_at
    });
  } catch (error) {
    console.error('GET /api/staff/:id/leave-balance error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function updateLeaveBalance(req, res) {
  try {
    const { id } = req.params;
    const { totalLeaveDays } = req.body;
    if (!totalLeaveDays || totalLeaveDays < 0) {
      return res.status(400).json({ error: 'Total leave days must be a positive number' });
    }
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      const staff = await User.findOne({ _id: id, role: 'staff' }).select('branch');
      if (!staff) return res.status(404).json({ error: 'Staff not found' });
      if (staff.branch !== manager?.branch) return res.status(403).json({ error: 'Access denied' });
    }
    let balance = await StaffLeaveBalance.findOne({ staff_id: id });
    if (!balance) {
      await StaffLeaveBalance.create({
        staff_id: id,
        total_leave_days: totalLeaveDays,
        used_leave_days: 0,
        remaining_leave_days: totalLeaveDays
      });
    } else {
      const newRemaining = totalLeaveDays - balance.used_leave_days;
      await StaffLeaveBalance.findByIdAndUpdate(balance._id, {
        total_leave_days: totalLeaveDays,
        remaining_leave_days: newRemaining,
        updated_at: new Date()
      });
    }
    res.json({ message: 'Leave balance updated successfully' });
  } catch (error) {
    console.error('PUT /api/staff/:id/leave-balance error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
