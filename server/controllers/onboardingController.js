import { OnboardingTask, User } from '../db.js';
import { hasHRPrivileges } from '../utils/roleHelpers.js';
import { getAreaManagerBranches } from '../utils/getAreaManagerBranches.js';

async function canManageStaffTasks(req, staffId) {
  if (hasHRPrivileges(req.user.role)) return true;
  if (req.user.role === 'operations_manager') return true;
  if (req.user.role === 'manager') {
    const [staff, mgr] = await Promise.all([
      User.findById(staffId).select('branch'),
      User.findById(req.user.id).select('branch'),
    ]);
    return staff?.branch && staff.branch === mgr?.branch;
  }
  if (req.user.role === 'area_manager') {
    const [staff, am] = await Promise.all([
      User.findById(staffId).select('branch'),
      User.findById(req.user.id).select('area'),
    ]);
    const branches = getAreaManagerBranches(am?.area);
    return staff?.branch && branches.includes(staff.branch);
  }
  return false;
}

export async function listTasks(req, res) {
  try {
    const { staffId } = req.query;
    if (!staffId) {
      return res.status(400).json({ error: 'staffId is required' });
    }
    if (!(await canManageStaffTasks(req, staffId))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const tasks = await OnboardingTask.find({ staff_id: staffId }).sort({
      sort_order: 1,
      created_at: 1,
    });
    res.json(tasks.map((t) => ({ ...t.toObject(), id: t.id })));
  } catch (e) {
    console.error('listTasks', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createTask(req, res) {
  try {
    const { staffId, title, due_date, sort_order } = req.body;
    if (!staffId || !title) {
      return res.status(400).json({ error: 'staffId and title are required' });
    }
    if (!(await canManageStaffTasks(req, staffId))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const doc = await OnboardingTask.create({
      staff_id: staffId,
      title,
      due_date: due_date || '',
      sort_order: sort_order ?? 0,
      created_by: req.user.id,
    });
    res.status(201).json({ id: doc.id });
  } catch (e) {
    console.error('createTask', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateTask(req, res) {
  try {
    const task = await OnboardingTask.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    if (!(await canManageStaffTasks(req, task.staff_id.toString()))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.body.title != null) task.title = req.body.title;
    if (req.body.due_date != null) task.due_date = req.body.due_date;
    if (req.body.sort_order != null) task.sort_order = req.body.sort_order;
    if (req.body.done !== undefined) {
      task.done = !!req.body.done;
      task.completed_at = task.done ? new Date() : null;
    }
    await task.save();
    res.json({ message: 'Updated' });
  } catch (e) {
    console.error('updateTask', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteTask(req, res) {
  try {
    const task = await OnboardingTask.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    if (!(await canManageStaffTasks(req, task.staff_id.toString()))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await task.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('deleteTask', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}
