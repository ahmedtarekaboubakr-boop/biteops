import { Schedule, ScheduleSubmission, HrNotification, User } from '../db.js';
import { logActivity } from '../utils/activityLogger.js';
import { getAreaManagerBranches } from '../utils/getAreaManagerBranches.js';

export async function getSchedules(req, res) {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    const match = {
      date: { $gte: startDate, $lte: endDate }
    };
    
    // Handle role-based filtering
    if (req.user.role === 'staff') {
      // Staff can only see their own branch's schedule
      const staffUser = await User.findById(req.user.id).select('branch');
      if (!staffUser || !staffUser.branch) {
        return res.status(400).json({ error: 'Staff branch not found' });
      }
      match.branch = staffUser.branch;
    } else if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      match.branch = manager.branch;
    } else if (req.user.role === 'area_manager') {
      const areaManager = await User.findById(req.user.id).select('area');
      const assignedBranches = getAreaManagerBranches(areaManager?.area);
      if (assignedBranches.length > 0) {
        match.branch = { $in: assignedBranches };
      }
    }
    const schedules = await Schedule.find(match)
      .populate('staff_id', 'name employee_code title status')
      .sort({ branch: 1, date: 1, shift: 1, 'staff_id.name': 1 })
      .lean();

    const filtered = schedules.filter(s => s.staff_id && (s.staff_id.status === 'active' || s.staff_id.status == null));
    res.json(filtered.map(s => ({
      id: s._id.toString(),
      staff_id: s.staff_id._id.toString(),
      date: s.date,
      shift: s.shift,
      staff_name: s.staff_id?.name,
      employee_code: s.staff_id?.employee_code,
      title: s.staff_id?.title,
      branch: s.branch,
      station: s.station
    })));
  } catch (error) {
    console.error('GET /api/schedules error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function createSchedule(req, res) {
  try {
    const { staffId, date, shift, station } = req.body;
    if (!staffId || !date || !shift) {
      return res.status(400).json({ error: 'staffId, date, and shift are required' });
    }
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch name');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      const staff = await User.findOne({
        _id: staffId,
        role: { $in: ['staff', 'manager', 'area_manager', 'operations_manager'] },
        $or: [{ status: 'active' }, { status: null }]
      }).select('branch');
      if (!staff) {
        return res.status(404).json({ error: 'Staff not found or inactive' });
      }
      if (staff.branch !== manager.branch && staff.branch !== 'Multi-Branch') {
        return res.status(403).json({ error: 'Access denied. You can only schedule staff from your branch.' });
      }
      try {
        const schedule = await Schedule.create({
          staff_id: staffId,
          date,
          shift,
          branch: manager.branch,
          station: station || null
        });
        const scheduleDate = new Date(date);
        const dayOfWeek = scheduleDate.getDay();
        const weekStart = new Date(scheduleDate);
        weekStart.setDate(scheduleDate.getDate() - dayOfWeek);
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const submission = await ScheduleSubmission.findOne({ branch: manager.branch, week_start: weekStartStr });
        if (submission) {
          await ScheduleSubmission.findByIdAndUpdate(submission._id, { status: 'edited', last_edited_at: new Date() });
          await HrNotification.create({
            type: 'schedule_edited',
            message: `${manager.name || 'Manager'} has edited the schedule for ${manager.branch} after submission`,
            branch: manager.branch,
            manager_id: req.user.id
          });
        }
        res.status(201).json({ id: schedule.id, staffId, date, shift, branch: manager.branch, station: station || null });
      } catch (err) {
        if (err.code === 11000) {
          return res.status(400).json({ error: 'Staff is already scheduled for this shift on this date' });
        }
        throw err;
      }
    } else {
      const staff = await User.findOne({
        _id: staffId,
        role: { $in: ['staff', 'manager', 'area_manager', 'operations_manager'] },
        $or: [{ status: 'active' }, { status: null }]
      }).select('branch');
      if (!staff) {
        return res.status(404).json({ error: 'Staff not found or inactive' });
      }
      try {
        const schedule = await Schedule.create({
          staff_id: staffId,
          date,
          shift,
          branch: staff.branch,
          station: station || null
        });
        res.status(201).json({ id: schedule.id, staffId, date, shift, branch: staff.branch, station: station || null });
      } catch (err) {
        if (err.code === 11000) {
          return res.status(400).json({ error: 'Staff is already scheduled for this shift on this date' });
        }
        throw err;
      }
    }
  } catch (error) {
    console.error('POST /api/schedules error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function deleteSchedule(req, res) {
  try {
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch name');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      const schedule = await Schedule.findById(req.params.id);
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      if (schedule.branch !== manager.branch) {
        return res.status(403).json({ error: 'Access denied. You can only delete schedules from your branch.' });
      }
      const scheduleDate = new Date(schedule.date);
      const dayOfWeek = scheduleDate.getDay();
      const weekStart = new Date(scheduleDate);
      weekStart.setDate(scheduleDate.getDate() - dayOfWeek);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const submission = await ScheduleSubmission.findOne({ branch: manager.branch, week_start: weekStartStr });
      if (submission) {
        await ScheduleSubmission.findByIdAndUpdate(submission._id, { status: 'edited', last_edited_at: new Date() });
        await HrNotification.create({
          type: 'schedule_edited',
          message: `${manager.name} has edited the schedule for ${manager.branch} after submission`,
          branch: manager.branch,
          manager_id: req.user.id
        });
      }
    }
    const result = await Schedule.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/schedules error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function swapSchedules(req, res) {
  try {
    const { scheduleId1, scheduleId2 } = req.body;
    if (!scheduleId1 || !scheduleId2) {
      return res.status(400).json({ error: 'Both scheduleId1 and scheduleId2 are required' });
    }
    const schedule1 = await Schedule.findById(scheduleId1);
    const schedule2 = await Schedule.findById(scheduleId2);
    if (!schedule1 || !schedule2) {
      return res.status(404).json({ error: 'One or both schedules not found' });
    }
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch name');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      if (schedule1.branch !== manager.branch || schedule2.branch !== manager.branch) {
        return res.status(403).json({ error: 'Access denied. You can only swap schedules from your branch.' });
      }
      const scheduleDate = new Date(schedule1.date);
      const dayOfWeek = scheduleDate.getDay();
      const weekStart = new Date(scheduleDate);
      weekStart.setDate(scheduleDate.getDate() - dayOfWeek);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const submission = await ScheduleSubmission.findOne({ branch: manager.branch, week_start: weekStartStr });
      if (submission) {
        await ScheduleSubmission.findByIdAndUpdate(submission._id, { status: 'edited', last_edited_at: new Date() });
        await HrNotification.create({
          type: 'schedule_edited',
          message: `${manager.name} has edited the schedule for ${manager.branch} after submission`,
          branch: manager.branch,
          manager_id: req.user.id
        });
      }
    }
    await Schedule.deleteMany({ _id: { $in: [scheduleId1, scheduleId2] } });
    await Schedule.create({
      staff_id: schedule2.staff_id,
      date: schedule1.date,
      shift: schedule1.shift,
      branch: schedule1.branch,
      station: schedule1.station || null
    });
    await Schedule.create({
      staff_id: schedule1.staff_id,
      date: schedule2.date,
      shift: schedule2.shift,
      branch: schedule2.branch,
      station: schedule2.station || null
    });
    res.json({ message: 'Shifts swapped successfully' });
  } catch (error) {
    console.error('POST /api/schedules/swap error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function submitSchedule(req, res) {
  try {
    const { weekStart, weekEnd, isEdit } = req.body;
    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart and weekEnd are required' });
    }
    const manager = await User.findById(req.user.id).select('branch name');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    const existing = await ScheduleSubmission.findOne({ branch: manager.branch, week_start: weekStart });
    if (existing) {
      await ScheduleSubmission.findByIdAndUpdate(existing._id, { status: 'submitted', submitted_at: new Date() });
    } else {
      await ScheduleSubmission.create({
        branch: manager.branch,
        week_start: weekStart,
        week_end: weekEnd,
        manager_id: req.user.id,
        status: 'submitted'
      });
    }
    const notificationType = isEdit ? 'schedule_edited' : 'schedule_submitted';
    const notificationMessage = isEdit
      ? `${manager.name} has edited the schedule for ${manager.branch} (${weekStart} to ${weekEnd})`
      : `${manager.name} has submitted the schedule for ${manager.branch} (${weekStart} to ${weekEnd})`;
    await HrNotification.create({
      type: notificationType,
      message: notificationMessage,
      branch: manager.branch,
      manager_id: req.user.id
    });
    await logActivity(
      req.user.id,
      manager.name,
      req.user.role,
      isEdit ? 'schedule_edited' : 'schedule_submitted',
      notificationMessage,
      manager.branch,
      { weekStart, weekEnd }
    );
    res.json({ message: isEdit ? 'Schedule updated successfully' : 'Schedule submitted successfully' });
  } catch (error) {
    console.error('POST /api/schedules/submit error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getSubmissionStatus(req, res) {
  try {
    const { weekStart } = req.query;
    if (!weekStart) {
      return res.status(400).json({ error: 'weekStart is required' });
    }
    const match = { week_start: weekStart };
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (manager && manager.branch) {
        match.branch = manager.branch;
      }
    }
    const submissions = await ScheduleSubmission.find(match)
      .populate('manager_id', 'name')
      .sort({ branch: 1 })
      .lean();
    res.json(submissions.map(s => ({
      ...s,
      id: s._id.toString(),
      manager_name: s.manager_id?.name || null
    })) || []);
  } catch (error) {
    console.error('GET /api/schedules/submission-status error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getSchedulesByDate(req, res) {
  try {
    const { date } = req.params;
    const { branch } = req.query;
    const dateStr = date.split('T')[0];
    const match = {
      date: dateStr
    };
    
    // Handle role-based branch filtering
    if (req.user.role === 'staff') {
      // Staff can only see their own branch's schedule
      const staffUser = await User.findById(req.user.id).select('branch');
      if (!staffUser || !staffUser.branch) {
        return res.status(400).json({ error: 'Staff branch not found' });
      }
      match.branch = staffUser.branch;
    } else if (branch) {
      // Owner, HR, Operations Manager can specify branch
      // Area Manager can specify branch if it's in their area (validated below)
      if (req.user.role === 'area_manager') {
        const areaManager = await User.findById(req.user.id).select('area');
        const assignedBranches = getAreaManagerBranches(areaManager?.area);
        if (!assignedBranches.includes(branch)) {
          return res.status(403).json({ error: 'Access denied. This branch is not in your area.' });
        }
      }
      match.branch = branch;
    } else if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      match.branch = manager.branch;
    } else if (req.user.role === 'area_manager') {
      const areaManager = await User.findById(req.user.id).select('area');
      const assignedBranches = getAreaManagerBranches(areaManager?.area);
      if (assignedBranches.length > 0) {
        match.branch = { $in: assignedBranches };
      }
    }
    const staff = await Schedule.aggregate([
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
          $or: [
            { 'user.status': 'active' },
            { 'user.status': null }
          ]
        }
      },
      {
        $group: {
          _id: { staff_id: '$staff_id', staff_name: '$user.name', employee_code: '$user.employee_code', title: '$user.title', branch: '$branch' },
          shifts: { $push: '$shift' }
        }
      },
      { $sort: { '_id.branch': 1, '_id.staff_name': 1 } },
      {
        $project: {
          staff_id: '$_id.staff_id',
          staff_name: '$_id.staff_name',
          employee_code: '$_id.employee_code',
          title: '$_id.title',
          branch: '$_id.branch',
          shifts: 1,
          _id: 0
        }
      }
    ]);
    res.json(staff.map(s => ({
      ...s,
      staff_id: s.staff_id?.toString(),
      shifts: s.shifts.join(',')
    })) || []);
  } catch (error) {
    console.error('GET /api/schedules/date/:date error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
