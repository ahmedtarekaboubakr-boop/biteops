import { HrNotification } from '../db.js';

export async function getNotifications(req, res) {
  try {
    const notifications = await HrNotification.find().sort({ created_at: -1 }).limit(50);
    res.json(notifications || []);
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function markAsRead(req, res) {
  try {
    await HrNotification.findByIdAndUpdate(req.params.id, { is_read: 1 });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('PUT /api/notifications/:id/read error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function markAllAsRead(req, res) {
  try {
    await HrNotification.updateMany({ is_read: 0 }, { is_read: 1 });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('PUT /api/notifications/read-all error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
