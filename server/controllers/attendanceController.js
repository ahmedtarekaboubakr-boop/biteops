import { FingerprintLog, AttendanceRecord, User } from '../db.js';
import { getShiftTimes } from '../utils/getShiftTimes.js';

export async function createFingerprintLog(req, res) {
  try {
    const { staffId, scanTime, scanType, fingerprintData, deviceId } = req.body;
    if (!staffId || !scanTime || !scanType) {
      return res.status(400).json({ error: 'Missing required fields: staffId, scanTime, scanType' });
    }
    if (!['clock_in', 'clock_out'].includes(scanType)) {
      return res.status(400).json({ error: 'scanType must be "clock_in" or "clock_out"' });
    }
    const staff = await User.findOne({
      _id: staffId,
      role: 'staff',
      $or: [{ status: 'active' }, { status: null }]
    }).select('branch');
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found or inactive' });
    }
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      if (staff.branch !== manager.branch) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const fingerprintLog = await FingerprintLog.create({
      staff_id: staffId,
      scan_time: scanTime,
      scan_type: scanType,
      fingerprint_data: fingerprintData || null,
      device_id: deviceId || null,
      branch: staff.branch
    });
    const scanDate = new Date(scanTime).toISOString().split('T')[0];
    const staffInfo = await User.findById(staffId).select('shift');
    const shift = staffInfo?.shift || 'morning';
    let attendance = await AttendanceRecord.findOne({
      staff_id: staffId,
      date: scanDate,
      shift
    });
    const shiftTimes = getShiftTimes(shift);
    const scanDateTime = new Date(scanTime);
    if (!attendance) {
      await AttendanceRecord.create({
        staff_id: staffId,
        date: scanDate,
        shift,
        scheduled_start_time: shiftTimes.start,
        scheduled_end_time: shiftTimes.end,
        clock_in_time: scanType === 'clock_in' ? scanTime : null,
        clock_out_time: scanType === 'clock_out' ? scanTime : null,
        status: scanType === 'clock_in' ? 'present' : 'absent',
        branch: staff.branch
      });
    } else {
      if (scanType === 'clock_in') {
        const scheduledStart = new Date(`${scanDate}T${shiftTimes.start}`);
        const lateMinutes = Math.max(0, Math.floor((scanDateTime - scheduledStart) / (1000 * 60)));
        await AttendanceRecord.findByIdAndUpdate(attendance._id, {
          clock_in_time: scanTime,
          late_minutes: lateMinutes,
          status: 'present',
          updated_at: new Date()
        });
      } else if (scanType === 'clock_out') {
        const scheduledEnd = new Date(`${scanDate}T${shiftTimes.end}`);
        if (shift === 'middle' || shift === 'night') {
          scheduledEnd.setDate(scheduledEnd.getDate() + 1);
        }
        const overtimeMinutes = Math.max(0, Math.floor((scanDateTime - scheduledEnd) / (1000 * 60)));
        const earlyLeaveMinutes = Math.max(0, Math.floor((scheduledEnd - scanDateTime) / (1000 * 60)));
        await AttendanceRecord.findByIdAndUpdate(attendance._id, {
          clock_out_time: scanTime,
          overtime_minutes: overtimeMinutes,
          early_leave_minutes: earlyLeaveMinutes,
          updated_at: new Date()
        });
      }
    }
    res.status(201).json({
      id: fingerprintLog.id,
      staffId,
      scanTime,
      scanType,
      message: 'Fingerprint log created successfully'
    });
  } catch (error) {
    console.error('POST /api/attendance/fingerprint error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getFingerprintLogs(req, res) {
  try {
    const { startDate, endDate, staffId } = req.query;
    const match = {};
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      match.branch = manager.branch;
    }
    if (startDate || endDate) {
      match.scan_time = {};
      if (startDate) match.scan_time.$gte = new Date(startDate);
      if (endDate) match.scan_time.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    if (staffId) match.staff_id = staffId;

    const logs = await FingerprintLog.find(match)
      .populate('staff_id', 'name employee_code status')
      .sort({ scan_time: -1 })
      .lean();

    const filtered = logs.filter(l => l.staff_id && (l.staff_id.status === 'active' || l.staff_id.status == null));
    res.json(filtered.map(l => ({
      ...l,
      id: l._id.toString(),
      staff_name: l.staff_id?.name,
      employee_code: l.staff_id?.employee_code
    })));
  } catch (error) {
    console.error('GET /api/attendance/fingerprint error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function clockInOut(req, res) {
  try {
    const { staffId, clockTime, clockType } = req.body;
    if (!staffId || !clockTime || !clockType) {
      return res.status(400).json({ error: 'Missing required fields: staffId, clockTime, clockType' });
    }
    if (!['clock_in', 'clock_out'].includes(clockType)) {
      return res.status(400).json({ error: 'clockType must be "clock_in" or "clock_out"' });
    }
    const staff = await User.findOne({ _id: staffId, role: 'staff' }).select('branch shift');
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      if (staff.branch !== manager.branch) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const clockDate = new Date(clockTime).toISOString().split('T')[0];
    const shift = staff.shift || 'morning';
    const shiftTimes = getShiftTimes(shift);
    const clockDateTime = new Date(clockTime);
    let attendance = await AttendanceRecord.findOne({
      staff_id: staffId,
      date: clockDate,
      shift
    });
    if (!attendance) {
      const scheduledStart = new Date(`${clockDate}T${shiftTimes.start}`);
      const lateMinutes = clockType === 'clock_in'
        ? Math.max(0, Math.floor((clockDateTime - scheduledStart) / (1000 * 60)))
        : 0;
      const newAttendance = await AttendanceRecord.create({
        staff_id: staffId,
        date: clockDate,
        shift,
        scheduled_start_time: shiftTimes.start,
        scheduled_end_time: shiftTimes.end,
        clock_in_time: clockType === 'clock_in' ? clockTime : null,
        clock_out_time: clockType === 'clock_out' ? clockTime : null,
        late_minutes: lateMinutes,
        status: clockType === 'clock_in' ? 'present' : 'absent',
        branch: staff.branch
      });
      res.status(201).json({ message: `${clockType} recorded successfully`, id: newAttendance.id });
    } else {
      if (clockType === 'clock_in') {
        const scheduledStart = new Date(`${clockDate}T${shiftTimes.start}`);
        const lateMinutes = Math.max(0, Math.floor((clockDateTime - scheduledStart) / (1000 * 60)));
        await AttendanceRecord.findByIdAndUpdate(attendance._id, {
          clock_in_time: clockTime,
          late_minutes: lateMinutes,
          status: 'present',
          updated_at: new Date()
        });
      } else if (clockType === 'clock_out') {
        const scheduledEnd = new Date(`${clockDate}T${shiftTimes.end}`);
        if (shift === 'middle' || shift === 'night') {
          scheduledEnd.setDate(scheduledEnd.getDate() + 1);
        }
        const overtimeMinutes = Math.max(0, Math.floor((clockDateTime - scheduledEnd) / (1000 * 60)));
        const earlyLeaveMinutes = Math.max(0, Math.floor((scheduledEnd - clockDateTime) / (1000 * 60)));
        await AttendanceRecord.findByIdAndUpdate(attendance._id, {
          clock_out_time: clockTime,
          overtime_minutes: overtimeMinutes,
          early_leave_minutes: earlyLeaveMinutes,
          updated_at: new Date()
        });
      }
      res.json({ message: `${clockType} updated successfully` });
    }
  } catch (error) {
    console.error('POST /api/attendance/clock error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getAttendance(req, res) {
  try {
    const { startDate, endDate, staffId } = req.query;
    const match = {};
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      match.branch = manager.branch;
    }
    if (startDate) match.date = { ...match.date, $gte: startDate };
    if (endDate) match.date = { ...match.date, $lte: endDate };
    if (staffId) match.staff_id = staffId;

    const records = await AttendanceRecord.find(match)
      .populate('staff_id', 'name employee_code status')
      .sort({ date: -1, 'staff_id.name': 1 })
      .lean();

    const filtered = records.filter(r => r.staff_id && (r.staff_id.status === 'active' || r.staff_id.status == null));
    res.json(filtered.map(r => ({
      ...r,
      id: r._id.toString(),
      staff_name: r.staff_id?.name,
      employee_code: r.staff_id?.employee_code
    })));
  } catch (error) {
    console.error('GET /api/attendance error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getSummary(req, res) {
  try {
    const { startDate, endDate, staffId } = req.query;
    const match = {};
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      match.branch = manager.branch;
    }
    if (startDate) match.date = { ...match.date, $gte: startDate };
    if (endDate) match.date = { ...match.date, $lte: endDate };
    if (staffId) match.staff_id = staffId;

    const summaries = await AttendanceRecord.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'staff_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $match: {
          $or: [{ 'user.status': 'active' }, { 'user.status': null }]
        }
      },
      {
        $group: {
          _id: { staff_id: '$staff_id', staff_name: '$user.name', employee_code: '$user.employee_code' },
          total_days: { $sum: 1 },
          present_days: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent_days: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          total_late_minutes: { $sum: '$late_minutes' },
          total_overtime_minutes: { $sum: '$overtime_minutes' },
          total_early_leave_minutes: { $sum: '$early_leave_minutes' }
        }
      },
      { $sort: { '_id.staff_name': 1 } },
      {
        $project: {
          staff_id: '$_id.staff_id',
          staff_name: '$_id.staff_name',
          employee_code: '$_id.employee_code',
          total_days: 1,
          present_days: 1,
          absent_days: 1,
          total_late_minutes: 1,
          total_overtime_minutes: 1,
          total_early_leave_minutes: 1,
          total_late_hours: { $divide: ['$total_late_minutes', 60] },
          total_overtime_hours: { $divide: ['$total_overtime_minutes', 60] },
          total_early_leave_hours: { $divide: ['$total_early_leave_minutes', 60] },
          _id: 0
        }
      }
    ]);
    const formatted = summaries.map(s => ({
      ...s,
      staff_id: s.staff_id?.toString(),
      total_late_hours: (s.total_late_minutes / 60).toFixed(2),
      total_overtime_hours: (s.total_overtime_minutes / 60).toFixed(2),
      total_early_leave_hours: (s.total_early_leave_minutes / 60).toFixed(2)
    }));
    res.json(formatted);
  } catch (error) {
    console.error('GET /api/attendance/summary error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getBranchStatistics(req, res) {
  try {
    if (!['hr_manager', 'owner', 'operations_manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate) match.date = { ...match.date, $gte: startDate };
    if (endDate) match.date = { ...match.date, $lte: endDate };

    const statistics = await AttendanceRecord.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'staff_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $match: {
          $or: [{ 'user.status': 'active' }, { 'user.status': null }]
        }
      },
      {
        $group: {
          _id: '$branch',
          total_staff: { $addToSet: '$staff_id' },
          total_records: { $sum: 1 },
          present_count: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent_count: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late_count: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          half_day_count: { $sum: { $cond: [{ $eq: ['$status', 'half_day'] }, 1, 0] } },
          on_leave_count: { $sum: { $cond: [{ $eq: ['$status', 'on_leave'] }, 1, 0] } },
          total_late_minutes: { $sum: '$late_minutes' },
          total_overtime_minutes: { $sum: '$overtime_minutes' },
          total_early_leave_minutes: { $sum: '$early_leave_minutes' },
          total_days: { $addToSet: '$date' }
        }
      },
      {
        $project: {
          branch: '$_id',
          total_staff: { $size: '$total_staff' },
          total_records: 1,
          present_count: 1,
          absent_count: 1,
          late_count: 1,
          half_day_count: 1,
          on_leave_count: 1,
          total_late_minutes: 1,
          total_overtime_minutes: 1,
          total_early_leave_minutes: 1,
          total_days: { $size: '$total_days' },
          _id: 0
        }
      },
      { $sort: { branch: 1 } }
    ]);
    const formatted = statistics.map(stat => {
      const attendanceRate = stat.total_records > 0
        ? ((stat.present_count / stat.total_records) * 100).toFixed(2)
        : 0;
      return {
        branch: stat.branch,
        total_staff: stat.total_staff,
        total_records: stat.total_records,
        total_days: stat.total_days,
        present_count: stat.present_count,
        absent_count: stat.absent_count,
        late_count: stat.late_count,
        half_day_count: stat.half_day_count,
        on_leave_count: stat.on_leave_count,
        attendance_rate: parseFloat(attendanceRate),
        total_late_hours: (stat.total_late_minutes / 60).toFixed(2),
        total_overtime_hours: (stat.total_overtime_minutes / 60).toFixed(2),
        total_early_leave_hours: (stat.total_early_leave_minutes / 60).toFixed(2)
      };
    });
    res.json(formatted);
  } catch (error) {
    console.error('GET /api/attendance/branch-statistics error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
