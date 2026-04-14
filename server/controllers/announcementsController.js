import { Announcement, AnnouncementView, User } from '../db.js';
import { logActivity } from '../utils/activityLogger.js';
import { getAreaManagerBranches } from '../utils/getAreaManagerBranches.js';

export async function createAnnouncement(req, res) {
  try {
    const allowedRoles = ['owner', 'hr_manager', 'area_manager', 'operations_manager', 'manager'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { title, message, targetRoles, targetBranches, targetStaffIds } = req.body;
    if (!title || !message || !targetRoles || !Array.isArray(targetRoles) || targetRoles.length === 0) {
      return res.status(400).json({ error: 'Title, message, and at least one target role are required' });
    }
    if (targetStaffIds && (!Array.isArray(targetStaffIds) || targetStaffIds.length === 0)) {
      return res.status(400).json({ error: 'targetStaffIds must be a non-empty array if provided' });
    }
    const restrictedRoles = ['owner', 'hr_manager', 'area_manager', 'operations_manager', 'manager'];
    if (restrictedRoles.includes(req.user.role) && targetRoles.includes(req.user.role)) {
      return res.status(400).json({ error: `You cannot send announcements to your own role (${req.user.role})` });
    }
    let finalTargetBranches = targetBranches;
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      finalTargetBranches = [manager.branch];
    } else if (req.user.role === 'area_manager') {
      const areaManager = await User.findById(req.user.id).select('area');
      if (!areaManager || !areaManager.area) {
        return res.status(400).json({ error: 'Area manager area not found' });
      }
      const assignedBranches = getAreaManagerBranches(areaManager.area);
      if (assignedBranches.length === 0) {
        return res.status(400).json({ error: 'No branches assigned to this area manager' });
      }
      if (!targetBranches || !Array.isArray(targetBranches) || targetBranches.length === 0) {
        return res.status(400).json({ error: 'Please select at least one branch from your assigned area' });
      }
      finalTargetBranches = targetBranches.filter(b => assignedBranches.includes(b));
      if (finalTargetBranches.length === 0) {
        return res.status(400).json({ error: 'Please select at least one branch from your assigned area' });
      }
    }
    const announcement = await Announcement.create({
      title,
      message,
      created_by: req.user.id,
      target_roles: JSON.stringify(targetRoles),
      target_branches: finalTargetBranches ? JSON.stringify(finalTargetBranches) : null,
      target_staff_ids: targetStaffIds && targetStaffIds.length > 0 ? JSON.stringify(targetStaffIds) : null
    });
    await logActivity(
      req.user.id,
      req.user.name || 'User',
      req.user.role,
      'announcement_created',
      `Created announcement: ${title}`,
      null,
      { title, targetRoles, targetBranches: finalTargetBranches }
    );
    res.status(201).json({ id: announcement.id, message: 'Announcement created successfully' });
  } catch (error) {
    console.error('POST /api/announcements error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAnnouncements(req, res) {
  try {
    const user = await User.findById(req.user.id).select('role branch');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const allAnnouncements = await Announcement.find()
      .populate('created_by', 'name')
      .sort({ created_at: -1 })
      .lean();

    const views = await AnnouncementView.find({ user_id: req.user.id })
      .select('announcement_id dismissed viewed_at')
      .lean();
    const viewMap = {};
    views.forEach(v => { viewMap[v.announcement_id.toString()] = v; });

    const filteredAnnouncements = allAnnouncements.filter(a => {
      const view = viewMap[a._id.toString()];
      if (view && view.dismissed) return false;
      try {
        const targetRoles = JSON.parse(a.target_roles);
        if (!targetRoles.includes(user.role)) return false;
        if (a.target_branches) {
          const targetBranches = JSON.parse(a.target_branches);
          if (user.branch && !targetBranches.includes(user.branch)) return false;
        }
        if (a.target_staff_ids && user.role === 'staff') {
          const targetStaffIds = JSON.parse(a.target_staff_ids);
          if (targetStaffIds.length > 0 && !targetStaffIds.some(id => id.toString() === req.user.id)) {
            return false;
          }
        }
        return true;
      } catch (e) {
        return false;
      }
    });

    res.json(filteredAnnouncements.map(a => ({
      ...a,
      id: a._id.toString(),
      created_by_name: a.created_by?.name || null,
      dismissed: viewMap[a._id.toString()]?.dismissed || 0,
      viewed_at: viewMap[a._id.toString()]?.viewed_at || null
    })) || []);
  } catch (error) {
    console.error('GET /api/announcements error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function dismissAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    const user = await User.findById(req.user.id).select('role branch');
    const targetRoles = JSON.parse(announcement.target_roles);
    if (!targetRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (announcement.target_branches) {
      const targetBranches = JSON.parse(announcement.target_branches);
      if (user.branch && !targetBranches.includes(user.branch)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    if (announcement.target_staff_ids && user.role === 'staff') {
      const targetStaffIds = JSON.parse(announcement.target_staff_ids);
      if (targetStaffIds.length > 0 && !targetStaffIds.some(uid => uid.toString() === req.user.id)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    await AnnouncementView.findOneAndUpdate(
      { announcement_id: id, user_id: req.user.id },
      { dismissed: 1, viewed_at: new Date() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Announcement dismissed' });
  } catch (error) {
    console.error('POST /api/announcements/:id/dismiss error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAllAnnouncements(req, res) {
  try {
    const allowedRoles = ['owner', 'hr_manager', 'area_manager', 'operations_manager', 'manager'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const announcements = await Announcement.find()
      .populate('created_by', 'name')
      .sort({ created_at: -1 })
      .lean();

    const viewCounts = await AnnouncementView.aggregate([
      { $group: { _id: '$announcement_id', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    viewCounts.forEach(v => { countMap[v._id.toString()] = v.count; });

    res.json(announcements.map(a => ({
      ...a,
      id: a._id.toString(),
      created_by_name: a.created_by?.name || null,
      view_count: countMap[a._id.toString()] || 0
    })) || []);
  } catch (error) {
    console.error('GET /api/announcements/all error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
