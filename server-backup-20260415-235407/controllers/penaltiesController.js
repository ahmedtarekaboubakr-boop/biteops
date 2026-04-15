import { Penalty, User } from '../db.js';
import { logActivity } from '../utils/activityLogger.js';

export async function createPenalty(req, res) {
  try {
    if (req.user.role === 'hr_manager') {
      return res.status(403).json({ error: 'HR managers cannot create penalties. Only branch managers can record penalties.' });
    }
    const { staffId, date, penaltyType, misconductDescription, penaltyAmount, penaltyDetails } = req.body;
    if (!staffId || !date || !penaltyType || !misconductDescription) {
      return res.status(400).json({ error: 'Missing required fields: staffId, date, penaltyType, misconductDescription' });
    }
    const staff = await User.findOne({
      _id: staffId,
      role: 'staff',
      $or: [{ status: 'active' }, { status: null }]
    }).select('branch');
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found or inactive' });
    }
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      if (staff.branch !== manager.branch) {
        return res.status(403).json({ error: 'Access denied. You can only create penalties for staff from your branch.' });
      }
    }
    const penalty = await Penalty.create({
      staff_id: staffId,
      date,
      penalty_type: penaltyType,
      misconduct_description: misconductDescription,
      penalty_amount: penaltyAmount || 0,
      penalty_details: penaltyDetails || '',
      manager_id: req.user.id,
      branch: staff.branch
    });
    const populated = await Penalty.findById(penalty._id)
      .populate('staff_id', 'name employee_code')
      .populate('manager_id', 'name')
      .lean();
    await logActivity(
      req.user.id,
      populated.manager_id?.name || 'User',
      req.user.role,
      'penalty_created',
      `Created ${penaltyType} penalty for ${populated.staff_id?.name}`,
      staff.branch,
      { staffId, penaltyType, misconductDescription, penaltyAmount }
    );
    const result = {
      ...populated,
      id: populated._id,
      staff_name: populated.staff_id?.name,
      employee_code: populated.staff_id?.employee_code,
      manager_name: populated.manager_id?.name
    };
    res.status(201).json(result);
  } catch (error) {
    console.error('POST /api/penalties error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getPenalties(req, res) {
  try {
    const { startDate, endDate, staffId, status, penaltyType } = req.query;
    const match = {};

    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      match.branch = manager.branch;
    }
    if (startDate) match.date = { ...match.date, $gte: startDate };
    if (endDate) match.date = { ...match.date, $lte: endDate };
    if (staffId) match.staff_id = staffId;
    if (status) match.status = status;
    if (penaltyType) match.penalty_type = penaltyType;

    const penalties = await Penalty.find(match)
      .populate('staff_id', 'name employee_code')
      .populate('manager_id', 'name')
      .sort({ date: -1, created_at: -1 })
      .lean();

    const result = penalties.map(p => ({
      ...p,
      id: p._id,
      staff_name: p.staff_id?.name,
      employee_code: p.staff_id?.employee_code,
      manager_name: p.manager_id?.name
    }));
    res.json(result);
  } catch (error) {
    console.error('GET /api/penalties error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getPenaltyById(req, res) {
  try {
    const { id } = req.params;
    const match = { _id: id };
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      match.branch = manager.branch;
    }
    const penalty = await Penalty.findOne(match)
      .populate('staff_id', 'name employee_code')
      .populate('manager_id', 'name')
      .lean();
    if (!penalty) {
      return res.status(404).json({ error: 'Penalty not found' });
    }
    res.json({
      ...penalty,
      id: penalty._id,
      staff_name: penalty.staff_id?.name,
      employee_code: penalty.staff_id?.employee_code,
      manager_name: penalty.manager_id?.name
    });
  } catch (error) {
    console.error('GET /api/penalties/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function updatePenalty(req, res) {
  try {
    if (req.user.role === 'hr_manager') {
      return res.status(403).json({ error: 'HR managers cannot edit penalties. Only branch managers can edit penalties.' });
    }
    const { id } = req.params;
    const { date, penaltyType, misconductDescription, penaltyAmount, penaltyDetails, status } = req.body;
    const match = { _id: id };
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      match.branch = manager.branch;
    }
    const existingPenalty = await Penalty.findOne(match);
    if (!existingPenalty) {
      return res.status(404).json({ error: 'Penalty not found' });
    }
    const updateData = {
      date: date || existingPenalty.date,
      penalty_type: penaltyType || existingPenalty.penalty_type,
      misconduct_description: misconductDescription || existingPenalty.misconduct_description,
      penalty_amount: penaltyAmount !== undefined ? penaltyAmount : existingPenalty.penalty_amount,
      penalty_details: penaltyDetails !== undefined ? penaltyDetails : existingPenalty.penalty_details,
      status: status || existingPenalty.status,
      updated_at: new Date()
    };
    const updatedPenalty = await Penalty.findByIdAndUpdate(id, updateData, { new: true })
      .populate('staff_id', 'name employee_code')
      .populate('manager_id', 'name')
      .lean();
    res.json({
      ...updatedPenalty,
      id: updatedPenalty._id,
      staff_name: updatedPenalty.staff_id?.name,
      employee_code: updatedPenalty.staff_id?.employee_code,
      manager_name: updatedPenalty.manager_id?.name
    });
  } catch (error) {
    console.error('PUT /api/penalties/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function deletePenalty(req, res) {
  try {
    if (req.user.role === 'hr_manager') {
      return res.status(403).json({ error: 'HR managers cannot delete penalties. Only branch managers can delete penalties.' });
    }
    const { id } = req.params;
    const match = { _id: id };
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      match.branch = manager.branch;
    }
    const result = await Penalty.deleteOne(match);
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Penalty not found' });
    }
    res.json({ message: 'Penalty deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/penalties/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
