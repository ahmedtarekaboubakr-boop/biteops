import { PrepChecklist, User } from '../db.js';
import { hasHRPrivileges } from '../utils/roleHelpers.js';

export const PREP_ITEM_DEFS = [
  { id: 'prep_line_sanitize', label: 'Line & station sanitized' },
  { id: 'prep_ingredients', label: 'Prep ingredients / mise en place' },
  { id: 'prep_sauces', label: 'Sauces & dressings ready' },
  { id: 'prep_fryer_oil', label: 'Fryer oil checked' },
  { id: 'prep_temp_logs', label: 'Temperature logs started' },
];

export function getPrepTemplate(req, res) {
  res.json(PREP_ITEM_DEFS);
}

export async function getPrepChecklists(req, res) {
  try {
    const { date, branch: branchQuery } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }
    const match = { date };
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager?.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      match.branch = manager.branch;
    } else if (
      hasHRPrivileges(req.user.role) ||
      req.user.role === 'operations_manager' ||
      req.user.role === 'area_manager'
    ) {
      if (branchQuery) match.branch = branchQuery;
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
    const items = await PrepChecklist.find(match);
    res.json(items || []);
  } catch (e) {
    console.error('getPrepChecklists', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function upsertPrepChecklist(req, res) {
  try {
    const { date, shift, itemId, completed } = req.body;
    if (!date || !shift || !itemId) {
      return res.status(400).json({ error: 'date, shift, and itemId are required' });
    }
    if (!PREP_ITEM_DEFS.some((d) => d.id === itemId)) {
      return res.status(400).json({ error: 'Invalid itemId' });
    }
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager?.branch) {
      return res.status(400).json({ error: 'Branch not found' });
    }
    if (req.user.role !== 'manager' && !hasHRPrivileges(req.user.role)) {
      return res.status(403).json({ error: 'Only branch managers can update prep checklist' });
    }
    const existing = await PrepChecklist.findOne({
      date,
      shift,
      item_id: itemId,
      branch: manager.branch,
    });
    if (existing) {
      await PrepChecklist.findByIdAndUpdate(existing._id, {
        completed: completed ? 1 : 0,
        updated_at: new Date(),
      });
    } else {
      await PrepChecklist.create({
        date,
        shift,
        item_id: itemId,
        completed: completed ? 1 : 0,
        branch: manager.branch,
        manager_id: req.user.id,
      });
    }
    res.json({ message: 'Saved' });
  } catch (e) {
    console.error('upsertPrepChecklist', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}
