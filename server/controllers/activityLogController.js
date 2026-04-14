import { ActivityLog } from '../db.js';

export async function getActivityLog(req, res) {
  try {
    const { limit = 100, offset = 0, actionType, userRole, branch } = req.query;
    const match = {};
    if (actionType) match.action_type = actionType;
    if (userRole) match.user_role = userRole;
    if (branch) match.branch = branch;
    const logs = await ActivityLog.find(match)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    res.json(logs || []);
  } catch (error) {
    console.error('GET /api/activity-log error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getActivityLogCount(req, res) {
  try {
    const count = await ActivityLog.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('GET /api/activity-log/count error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function clearActivityLog(req, res) {
  try {
    await ActivityLog.deleteMany({});
    res.json({ message: 'All activity logs deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/activity-log error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function deleteActivityLog(req, res) {
  try {
    await ActivityLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Activity log deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/activity-log/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
