import { ShiftSwapRequest, User } from '../db.js';
import { hasHRPrivileges } from '../utils/roleHelpers.js';
import { logActivity } from '../utils/activityLogger.js';

async function branchScopeMatch(req) {
  const role = req.user.role;
  if (hasHRPrivileges(role) || role === 'operations_manager' || role === 'area_manager') {
    return {};
  }
  if (role === 'manager') {
    const m = await User.findById(req.user.id).select('branch');
    return m?.branch ? { branch: m.branch } : { branch: '__none__' };
  }
  return { branch: '__none__' };
}

export async function listShiftSwaps(req, res) {
  try {
    if (req.user.role === 'staff') {
      const list = await ShiftSwapRequest.find({ requester_id: req.user.id })
        .sort({ created_at: -1 })
        .populate('target_staff_id', 'name')
        .lean();
      return res.json(list.map(mapRow));
    }
    const scope = await branchScopeMatch(req);
    const list = await ShiftSwapRequest.find(scope)
      .sort({ created_at: -1 })
      .populate('requester_id', 'name employee_code')
      .populate('target_staff_id', 'name employee_code')
      .populate('reviewed_by', 'name')
      .lean();
    res.json(list.map(mapRow));
  } catch (e) {
    console.error('listShiftSwaps', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function mapRow(r) {
  return {
    ...r,
    id: r._id.toString(),
    requester_id: r.requester_id?._id?.toString?.() ?? r.requester_id,
    target_staff_id: r.target_staff_id?._id?.toString?.() ?? r.target_staff_id,
    reviewed_by: r.reviewed_by?._id?.toString?.() ?? r.reviewed_by,
    requester_name: r.requester_id?.name,
    target_name: r.target_staff_id?.name,
    reviewer_name: r.reviewed_by?.name,
  };
}

export async function createShiftSwap(req, res) {
  try {
    if (req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Only staff can create swap requests' });
    }
    const { date, shift, targetStaffId, note } = req.body;
    if (!date || !shift) {
      return res.status(400).json({ error: 'date and shift are required' });
    }
    const me = await User.findById(req.user.id).select('branch name role');
    if (!me?.branch) {
      return res.status(400).json({ error: 'Branch not set on profile' });
    }
    let target = null;
    if (targetStaffId) {
      target = await User.findOne({
        _id: targetStaffId,
        branch: me.branch,
        role: 'staff',
      }).select('_id');
      if (!target) {
        return res.status(400).json({ error: 'Invalid target staff for your branch' });
      }
    }
    const doc = await ShiftSwapRequest.create({
      requester_id: me._id,
      target_staff_id: target?._id || null,
      date,
      shift,
      branch: me.branch,
      note: note || '',
      status: 'pending',
    });
    await logActivity(
      me._id,
      me.name,
      me.role,
      'shift_swap_requested',
      `Requested shift swap/coverage for ${date} (${shift})`,
      me.branch,
      {}
    );
    res.status(201).json({ id: doc.id, message: 'Request submitted' });
  } catch (e) {
    console.error('createShiftSwap', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function reviewShiftSwap(req, res) {
  try {
    const { status } = req.body;
    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved or denied' });
    }
    if (req.user.role === 'staff') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const doc = await ShiftSwapRequest.findById(req.params.id);
    if (!doc || doc.status !== 'pending') {
      return res.status(404).json({ error: 'Request not found or not pending' });
    }
    const scope = await branchScopeMatch(req);
    if (scope.branch && doc.branch !== scope.branch) {
      return res.status(403).json({ error: 'Access denied' });
    }
    doc.status = status;
    doc.reviewed_by = req.user.id;
    doc.reviewed_at = new Date();
    await doc.save();
    const reviewer = await User.findById(req.user.id).select('name role branch');
    await logActivity(
      req.user.id,
      reviewer?.name,
      reviewer?.role,
      `shift_swap_${status}`,
      `${status} shift swap request`,
      doc.branch,
      { requestId: doc._id }
    );
    res.json({ message: 'Updated' });
  } catch (e) {
    console.error('reviewShiftSwap', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function cancelShiftSwap(req, res) {
  try {
    const doc = await ShiftSwapRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.requester_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (doc.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be cancelled' });
    }
    doc.status = 'cancelled';
    await doc.save();
    res.json({ message: 'Cancelled' });
  } catch (e) {
    console.error('cancelShiftSwap', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/** Staff: pick a coworker for swap target (same branch). */
export async function listColleagues(req, res) {
  try {
    if (req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Staff only' });
    }
    const me = await User.findById(req.user.id).select('branch _id');
    if (!me?.branch) {
      return res.status(400).json({ error: 'Branch not set' });
    }
    const list = await User.find({
      branch: me.branch,
      role: 'staff',
      _id: { $ne: me._id },
      $or: [{ status: 'active' }, { status: null }],
    })
      .select('name')
      .sort({ name: 1 })
      .lean();
    res.json(list.map((u) => ({ id: u._id.toString(), name: u.name })));
  } catch (e) {
    console.error('listColleagues', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}
