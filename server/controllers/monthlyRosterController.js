import { MonthlyRosterEntry, MonthlyRosterSubmission, HrNotification, User } from '../db.js';
import { logActivity } from '../utils/activityLogger.js';

export async function getRoster(req, res) {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ error: 'year and month are required' });
    }
    let branch;
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager?.branch) return res.status(400).json({ error: 'Manager branch not found' });
      branch = manager.branch;
    } else {
      branch = req.query.branch;
      if (!branch) return res.status(400).json({ error: 'branch is required' });
    }

    const entries = await MonthlyRosterEntry.find({
      branch,
      year: parseInt(year),
      month: parseInt(month)
    }).lean();

    res.json(entries.map(e => ({
      id: e._id.toString(),
      staff_id: e.staff_id.toString(),
      day: e.day,
      status: e.status
    })));
  } catch (error) {
    console.error('GET /api/monthly-roster error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function upsertEntry(req, res) {
  try {
    const { staffId, year, month, day, status } = req.body;
    if (!staffId || !year || !month || !day || !status) {
      return res.status(400).json({ error: 'staffId, year, month, day, status are required' });
    }
    if (!['P', 'O', 'A', 'X', 'C', 'H', 'V', 'SL'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    let branch;
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager?.branch) return res.status(400).json({ error: 'Manager branch not found' });
      branch = manager.branch;
    } else {
      branch = req.body.branch;
      if (!branch) return res.status(400).json({ error: 'branch is required' });
    }

    const entry = await MonthlyRosterEntry.findOneAndUpdate(
      { branch, year: parseInt(year), month: parseInt(month), staff_id: staffId, day: parseInt(day) },
      { status },
      { upsert: true, new: true }
    );

    // If the month was already submitted, mark it as edited
    const sub = await MonthlyRosterSubmission.findOne({ branch, year: parseInt(year), month: parseInt(month) });
    if (sub && sub.status === 'submitted') {
      await MonthlyRosterSubmission.findByIdAndUpdate(sub._id, { status: 'edited', last_edited_at: new Date() });
    }

    res.json({ id: entry._id.toString(), staff_id: staffId, day, status });
  } catch (error) {
    console.error('PUT /api/monthly-roster/entry error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function deleteEntry(req, res) {
  try {
    const { staffId, year, month, day } = req.body;
    let branch;
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager?.branch) return res.status(400).json({ error: 'Manager branch not found' });
      branch = manager.branch;
    } else {
      branch = req.body.branch;
    }
    await MonthlyRosterEntry.findOneAndDelete({
      branch, year: parseInt(year), month: parseInt(month), staff_id: staffId, day: parseInt(day)
    });
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    console.error('DELETE /api/monthly-roster/entry error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getSubmissionStatus(req, res) {
  try {
    const { year, month } = req.query;
    if (!year || !month) return res.status(400).json({ error: 'year and month are required' });
    let branch;
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager?.branch) return res.status(400).json({ error: 'Manager branch not found' });
      branch = manager.branch;
    } else {
      branch = req.query.branch;
      if (!branch) return res.status(400).json({ error: 'branch is required' });
    }
    const sub = await MonthlyRosterSubmission.findOne({
      branch, year: parseInt(year), month: parseInt(month)
    }).populate('manager_id', 'name').lean();
    if (!sub) return res.json(null);
    res.json({ ...sub, id: sub._id.toString(), manager_name: sub.manager_id?.name || null });
  } catch (error) {
    console.error('GET /api/monthly-roster/submission-status error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function submitRoster(req, res) {
  try {
    const { year, month } = req.body;
    if (!year || !month) return res.status(400).json({ error: 'year and month are required' });
    const manager = await User.findById(req.user.id).select('branch name');
    if (!manager?.branch) return res.status(400).json({ error: 'Manager branch not found' });
    const { branch, name } = manager;

    const existing = await MonthlyRosterSubmission.findOne({ branch, year: parseInt(year), month: parseInt(month) });
    const isEdit = !!existing;
    if (existing) {
      await MonthlyRosterSubmission.findByIdAndUpdate(existing._id, { status: 'submitted', submitted_at: new Date() });
    } else {
      await MonthlyRosterSubmission.create({ branch, year: parseInt(year), month: parseInt(month), manager_id: req.user.id, status: 'submitted' });
    }

    const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const msg = isEdit
      ? `${name} updated the monthly roster for ${branch} — ${monthName}`
      : `${name} submitted the monthly roster for ${branch} — ${monthName}`;

    await HrNotification.create({
      type: isEdit ? 'schedule_edited' : 'schedule_submitted',
      message: msg,
      branch,
      manager_id: req.user.id
    });

    await logActivity(req.user.id, name, req.user.role,
      isEdit ? 'schedule_edited' : 'schedule_submitted', msg, branch,
      { year, month }
    );

    res.json({ message: 'Roster submitted successfully' });
  } catch (error) {
    console.error('POST /api/monthly-roster/submit error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
