import { Checklist, User } from '../db.js';

export async function getHistory(req, res) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const match = { date: { $gte: startDate } };
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      match.branch = manager.branch;
    }
    const items = await Checklist.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$date',
          morning_completed: { $sum: { $cond: [{ $and: [{ $eq: ['$shift', 'morning'] }, { $eq: ['$completed', 1] }] }, 1, 0] } },
          night_completed: { $sum: { $cond: [{ $and: [{ $eq: ['$shift', 'night'] }, { $eq: ['$completed', 1] }] }, 1, 0] } }
        }
      },
      { $sort: { _id: -1 } },
      { $project: { date: '$_id', morning_completed: 1, night_completed: 1, _id: 0 } }
    ]);
    res.json(items || []);
  } catch (error) {
    console.error('GET /api/checklists/history error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getChecklists(req, res) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }
    const match = { date };
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      match.branch = manager.branch;
    }
    const items = await Checklist.find(match);
    res.json(items || []);
  } catch (error) {
    console.error('GET /api/checklists error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function createChecklist(req, res) {
  try {
    const { date, shift, itemId, completed } = req.body;
    if (!date || !shift || !itemId) {
      return res.status(400).json({ error: 'date, shift, and itemId are required' });
    }
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    const existing = await Checklist.findOne({
      date,
      shift,
      item_id: itemId,
      branch: manager.branch
    });
    if (existing) {
      await Checklist.findByIdAndUpdate(existing._id, {
        completed: completed ? 1 : 0,
        updated_at: new Date()
      });
    } else {
      await Checklist.create({
        date,
        shift,
        item_id: itemId,
        completed: completed ? 1 : 0,
        branch: manager.branch,
        manager_id: req.user.id
      });
    }
    res.json({ success: true, date, shift, itemId, completed });
  } catch (error) {
    console.error('POST /api/checklists error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
