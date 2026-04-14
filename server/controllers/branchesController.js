import { Branch, User } from '../db.js';
import { logActivity } from '../utils/activityLogger.js';

export async function getBranches(req, res) {
  try {
    const branches = await Branch.find()
      .populate('manager_id', 'name')
      .sort({ name: 1 })
      .lean();

    const result = await Promise.all(branches.map(async (b) => {
      const staffCount = await User.countDocuments({
        branch: b.name,
        $or: [{ status: 'active' }, { status: null }]
      });
      return {
        ...b,
        id: b._id.toString(),
        manager_name: b.manager_id?.name || null,
        staff_count: staffCount
      };
    }));
    res.json(result || []);
  } catch (error) {
    console.error('GET /api/branches error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getBranchById(req, res) {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate('manager_id', 'name')
      .lean();
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    const staff = await User.find({
      branch: branch.name,
      $or: [{ status: 'active' }, { status: null }]
    })
      .select('name employee_code title role')
      .sort({ name: 1 })
      .lean();
    res.json({
      ...branch,
      id: branch._id.toString(),
      manager_name: branch.manager_id?.name || null,
      staff: staff.map(s => ({
        id: s._id.toString(),
        name: s.name,
        employee_code: s.employee_code,
        title: s.title,
        role: s.role
      }))
    });
  } catch (error) {
    console.error('GET /api/branches/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function createBranch(req, res) {
  try {
    const { name, phone, managerId, area } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Branch name is required' });
    }
    if (!area || !['Fifth Settlement', '6th of October'].includes(area)) {
      return res.status(400).json({ error: 'Area is required and must be either "Fifth Settlement" or "6th of October"' });
    }
    const existing = await Branch.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: 'Branch name already exists' });
    }
    if (managerId) {
      const manager = await User.findOne({ _id: managerId, role: 'manager' });
      if (!manager) {
        return res.status(400).json({ error: 'Invalid manager ID' });
      }
    }
    const branch = await Branch.create({
      name,
      phone: phone || null,
      manager_id: managerId || null,
      area
    });
    if (managerId) {
      await User.findByIdAndUpdate(managerId, { branch: name });
    }
    const populated = await Branch.findById(branch._id)
      .populate('manager_id', 'name')
      .lean();
    const hrUser = await User.findById(req.user.id).select('name');
    await logActivity(
      req.user.id,
      hrUser?.name || 'HR',
      req.user.role,
      'branch_created',
      `Created new branch: ${name}`,
      name,
      { branchId: branch._id.toString(), branchName: name }
    );
    res.status(201).json({
      ...populated,
      id: populated._id.toString(),
      manager_name: populated.manager_id?.name || null
    });
  } catch (error) {
    console.error('POST /api/branches error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function updateBranch(req, res) {
  try {
    const { name, phone, managerId, area } = req.body;
    const branchId = req.params.id;
    const existing = await Branch.findById(branchId);
    if (!existing) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    if (area && !['Fifth Settlement', '6th of October'].includes(area)) {
      return res.status(400).json({ error: 'Area must be either "Fifth Settlement" or "6th of October"' });
    }
    if (name && name !== existing.name) {
      const nameExists = await Branch.findOne({ name, _id: { $ne: branchId } });
      if (nameExists) {
        return res.status(400).json({ error: 'Branch name already exists' });
      }
      await User.updateMany({ branch: existing.name }, { branch: name });
    }
    if (managerId) {
      const manager = await User.findOne({ _id: managerId, role: 'manager' });
      if (!manager) {
        return res.status(400).json({ error: 'Invalid manager ID' });
      }
      await User.findByIdAndUpdate(managerId, { branch: name || existing.name });
      if (existing.manager_id && existing.manager_id.toString() !== managerId) {
        await User.findByIdAndUpdate(existing.manager_id, { branch: null });
      }
    }
    const updateData = {
      name: name || existing.name,
      phone: phone !== undefined ? phone : existing.phone,
      manager_id: managerId !== undefined ? managerId : existing.manager_id,
      area: area !== undefined ? area : existing.area,
      updated_at: new Date()
    };
    await Branch.findByIdAndUpdate(branchId, updateData);
    const updated = await Branch.findById(branchId)
      .populate('manager_id', 'name')
      .lean();
    const hrUser = await User.findById(req.user.id).select('name');
    await logActivity(
      req.user.id,
      hrUser?.name || 'HR',
      req.user.role,
      'branch_updated',
      `Updated branch: ${name || existing.name}`,
      name || existing.name,
      { branchId, branchName: name || existing.name }
    );
    res.json({
      ...updated,
      id: updated._id.toString(),
      manager_name: updated.manager_id?.name || null
    });
  } catch (error) {
    console.error('PUT /api/branches/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function deleteBranch(req, res) {
  try {
    const branchId = req.params.id;
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    const staffCount = await User.countDocuments({
      branch: branch.name,
      $or: [{ status: 'active' }, { status: null }]
    });
    if (staffCount > 0) {
      return res.status(400).json({
        error: `Cannot delete branch. There are ${staffCount} active staff members assigned to this branch. Please reassign them first.`
      });
    }
    await Branch.findByIdAndDelete(branchId);
    const hrUser = await User.findById(req.user.id).select('name');
    await logActivity(
      req.user.id,
      hrUser?.name || 'HR',
      req.user.role,
      'branch_deleted',
      `Deleted branch: ${branch.name}`,
      branch.name,
      { branchId, branchName: branch.name }
    );
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/branches/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function assignStaff(req, res) {
  try {
    const { staffIds } = req.body;
    const branchId = req.params.id;
    if (!Array.isArray(staffIds)) {
      return res.status(400).json({ error: 'staffIds must be an array' });
    }
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    if (staffIds.length > 0) {
      await User.updateMany({ _id: { $in: staffIds } }, { branch: branch.name });
    }
    const staff = await User.find({
      branch: branch.name,
      $or: [{ status: 'active' }, { status: null }]
    })
      .select('name employee_code title role')
      .sort({ name: 1 })
      .lean();
    const hrUser = await User.findById(req.user.id).select('name');
    await logActivity(
      req.user.id,
      hrUser?.name || 'HR',
      req.user.role,
      'branch_staff_assigned',
      `Assigned ${staffIds.length} staff member(s) to branch: ${branch.name}`,
      branch.name,
      { branchId, branchName: branch.name, staffCount: staffIds.length }
    );
    res.json({
      message: 'Staff assigned successfully',
      staff: staff.map(s => ({
        id: s._id.toString(),
        name: s.name,
        employee_code: s.employee_code,
        title: s.title,
        role: s.role
      }))
    });
  } catch (error) {
    console.error('PUT /api/branches/:id/assign-staff error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getAvailableStaff(req, res) {
  try {
    const branchId = req.params.id;
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    const staff = await User.find({
      role: { $in: ['staff', 'manager', 'area_manager', 'operations_manager'] },
      $or: [{ status: 'active' }, { status: null }]
    })
      .select('name employee_code title role branch')
      .sort({ name: 1 })
      .lean();
    res.json(staff.map(s => ({
      id: s._id.toString(),
      name: s.name,
      employee_code: s.employee_code,
      title: s.title,
      role: s.role,
      branch: s.branch
    })) || []);
  } catch (error) {
    console.error('GET /api/branches/:id/available-staff error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getBranchManagers(req, res) {
  try {
    const managers = await User.find({
      role: 'manager',
      title: 'Branch Manager',
      $or: [{ status: 'active' }, { status: null }]
    })
      .select('name employee_code title role branch')
      .sort({ name: 1 })
      .lean();
    res.json(managers.map(m => ({
      id: m._id.toString(),
      name: m.name,
      employee_code: m.employee_code,
      title: m.title,
      role: m.role,
      branch: m.branch
    })) || []);
  } catch (error) {
    console.error('GET /api/branch-managers error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function initializeBranches(req, res) {
  try {
    const branchConfigs = [
      { name: 'Mivida', area: 'Fifth Settlement' },
      { name: 'Leven', area: 'Fifth Settlement' },
      { name: 'Sodic Villete', area: 'Fifth Settlement' },
      { name: 'Arkan', area: '6th of October' },
      { name: 'Palm Hills', area: '6th of October' }
    ];
    const createdBranches = [];
    const skippedBranches = [];
    for (const branchConfig of branchConfigs) {
      const existing = await Branch.findOne({ name: branchConfig.name });
      if (existing) {
        skippedBranches.push(branchConfig.name);
        continue;
      }
      await Branch.create({
        name: branchConfig.name,
        phone: null,
        manager_id: null,
        area: branchConfig.area
      });
      createdBranches.push(branchConfig.name);
    }
    const hrUser = await User.findById(req.user.id).select('name');
    await logActivity(
      req.user.id,
      hrUser?.name || 'HR',
      req.user.role,
      'branches_initialized',
      `Initialized ${createdBranches.length} existing branches`,
      null,
      { createdBranches, skippedBranches }
    );
    res.json({
      message: 'Branches initialized successfully',
      created: createdBranches,
      skipped: skippedBranches
    });
  } catch (error) {
    console.error('POST /api/branches/initialize error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
