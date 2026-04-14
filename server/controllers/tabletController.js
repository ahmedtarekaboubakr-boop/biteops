import { User, AttendanceRecord } from '../db.js';
import { getShiftTimes } from '../utils/getShiftTimes.js';

const VALID_BRANCHES = ['Mivida', 'Leven', 'Sodic Villete', 'Arkan', 'Palm Hills'];

export async function getTabletStaff(req, res) {
  try {
    const branchName = decodeURIComponent(req.params.branchName);

    if (!VALID_BRANCHES.includes(branchName)) {
      return res.status(400).json({ error: 'Invalid branch name' });
    }

    const staff = await User.find({
      branch: branchName,
      role: 'staff',
      $or: [{ status: 'active' }, { status: null }]
    })
      .select('name employee_code branch')
      .sort({ name: 1 })
      .lean();

    const today = new Date().toISOString().split('T')[0];
    const staffWithAttendance = await Promise.all(
      staff.map(async (staffMember) => {
        const todayRecord = await AttendanceRecord.findOne(
          { staff_id: staffMember._id, date: today }
        )
          .sort({ created_at: -1 })
          .select('clock_in_time clock_out_time status')
          .lean();
        return {
          id: staffMember._id.toString(),
          name: staffMember.name,
          employee_code: staffMember.employee_code,
          branch: staffMember.branch,
          todayRecord: todayRecord ? {
            clock_in_time: todayRecord.clock_in_time,
            clock_out_time: todayRecord.clock_out_time,
            status: todayRecord.status
          } : null
        };
      })
    );

    res.json(staffWithAttendance);
  } catch (error) {
    console.error('GET /api/tablet/staff/:branchName error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function tabletClock(req, res) {
  try {
    const { staffId, clockTime, clockType, branch: branchParam } = req.body;

    if (!staffId || !clockTime || !clockType || !branchParam) {
      return res.status(400).json({ error: 'Missing required fields: staffId, clockTime, clockType, branch' });
    }

    if (!['clock_in', 'clock_out'].includes(clockType)) {
      return res.status(400).json({ error: 'clockType must be "clock_in" or "clock_out"' });
    }

    if (!VALID_BRANCHES.includes(branchParam)) {
      return res.status(400).json({ error: 'Invalid branch name' });
    }

    const staff = await User.findOne({
      _id: staffId,
      role: 'staff',
      $or: [{ status: 'active' }, { status: null }]
    }).select('branch shift');

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found or inactive' });
    }

    if (staff.branch !== branchParam) {
      return res.status(403).json({ error: 'Staff does not belong to this branch' });
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
    console.error('POST /api/tablet/clock error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
