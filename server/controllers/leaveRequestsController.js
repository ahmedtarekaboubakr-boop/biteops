import { LeaveRequest, User, HrNotification, StaffLeaveBalance } from '../db.js';
import { logActivity } from '../utils/activityLogger.js';
import { getAreaManagerBranches } from '../utils/getAreaManagerBranches.js';
import { hasHRPrivileges } from '../utils/roleHelpers.js';

async function getAreaManagerForBranch(branch) {
  const normalizedBranch = branch?.trim()?.toLowerCase();
  const fifthSettlementBranches = ['mivida', 'leven', 'sodic villete'];
  const sixthOctoberBranches = ['arkan', 'palm hills'];
  let area = null;
  if (fifthSettlementBranches.includes(normalizedBranch)) {
    area = 'Fifth Settlement';
  } else if (sixthOctoberBranches.includes(normalizedBranch)) {
    area = '6th of October';
  }
  if (area) {
    const areaManager = await User.findOne({ role: 'area_manager', area }).select('_id name');
    return areaManager;
  }
  return null;
}

export async function getLeaveRequests(req, res) {
  try {
    const { status, requestType } = req.query;
    const match = {};
    if (req.user.role === 'staff') {
      match.staff_id = req.user.id;
    } else if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      match.branch = manager.branch;
    } else if (req.user.role === 'area_manager') {
      const areaManager = await User.findById(req.user.id).select('area');
      const assignedBranches = getAreaManagerBranches(areaManager?.area);
      if (assignedBranches.length > 0) {
        match.branch = { $in: assignedBranches };
      } else {
        match.branch = { $exists: false };
      }
    }
    if (status) match.status = status;
    if (requestType) match.request_type = requestType;

    const requests = await LeaveRequest.find(match)
      .populate('staff_id', 'name employee_code status')
      .populate('manager_id', 'name')
      .populate('area_manager_id', 'name')
      .populate('operations_manager_id', 'name')
      .populate('hr_manager_id', 'name')
      .sort({ created_at: -1 })
      .lean();

    const filtered = requests.filter(r => r.staff_id && (r.staff_id.status === 'active' || r.staff_id.status == null));
    res.json(filtered.map(r => ({
      ...r,
      id: r._id.toString(),
      staff_name: r.staff_id?.name,
      employee_code: r.staff_id?.employee_code,
      manager_name: r.manager_id?.name,
      area_manager_name: r.area_manager_id?.name,
      operations_manager_name: r.operations_manager_id?.name,
      hr_manager_name: r.hr_manager_id?.name
    })));
  } catch (error) {
    console.error('GET /api/leave-requests error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function createLeaveRequest(req, res) {
  try {
    const { staffId, requestType, startDate, endDate, reason } = req.body;
    if (!requestType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields: requestType, startDate, endDate' });
    }
    let targetStaffId;
    if (req.user.role === 'staff') {
      return res.status(403).json({ error: 'Staff members cannot create leave requests. Please contact your branch manager.' });
    } else if (req.user.role === 'manager') {
      if (!staffId) {
        return res.status(400).json({ error: 'staffId is required when creating requests as a manager' });
      }
      targetStaffId = staffId;
    } else {
      return res.status(403).json({ error: 'Only branch managers can create leave requests' });
    }
    const staff = await User.findOne({
      _id: targetStaffId,
      role: 'staff',
      $or: [{ status: 'active' }, { status: null }]
    }).select('branch name');
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found or inactive' });
    }
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      if (staff.branch !== manager.branch) {
        return res.status(403).json({ error: 'Access denied. You can only create requests for staff from your branch.' });
      }
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const leaveRequest = await LeaveRequest.create({
      staff_id: targetStaffId,
      request_type: requestType,
      start_date: startDate,
      end_date: endDate,
      number_of_days: diffDays,
      reason: reason || '',
      branch: staff.branch,
      manager_id: req.user.id
    });
    try {
      const areaManager = await getAreaManagerForBranch(staff.branch);
      if (areaManager) {
        await HrNotification.create({
          type: 'leave_request_pending',
          message: `Leave request from ${staff.name} (${staff.branch}) needs Area Manager approval`,
          branch: staff.branch,
          manager_id: areaManager._id
        });
      }
    } catch (notifError) {
      console.error('Error notifying area manager:', notifError);
    }
    const managerInfo = await User.findById(req.user.id).select('name');
    await logActivity(
      req.user.id,
      managerInfo?.name || 'Manager',
      req.user.role,
      'leave_request_created',
      `Created ${requestType} request for ${staff.name} (${startDate} to ${endDate})`,
      staff.branch,
      { staffId: targetStaffId, staffName: staff.name, requestType, startDate, endDate, days: diffDays }
    );
    res.status(201).json({
      id: leaveRequest.id,
      staffId: targetStaffId,
      requestType,
      startDate,
      endDate,
      numberOfDays: diffDays,
      status: 'pending'
    });
  } catch (error) {
    console.error('POST /api/leave-requests error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function updateLeaveRequest(req, res) {
  try {
    const { status } = req.body;
    const requestId = req.params.id;
    if (!status || !['approved', 'denied'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "denied"' });
    }
    const request = await LeaveRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    let currentStage = null;
    let canApprove = false;
    let nextStage = null;
    if (request.area_manager_status === 'pending') {
      currentStage = 'area_manager';
      if (req.user.role === 'area_manager') {
        const areaManager = await User.findById(req.user.id).select('area');
        const assignedBranches = getAreaManagerBranches(areaManager?.area);
        const normalizedRequestBranch = request.branch?.trim()?.toLowerCase();
        const normalizedAssignedBranches = assignedBranches.map(b => b?.trim()?.toLowerCase());
        if (normalizedAssignedBranches.includes(normalizedRequestBranch)) {
          canApprove = true;
          nextStage = status === 'approved' ? 'operations_manager' : null;
        }
      }
    } else if (request.area_manager_status === 'approved' && request.operations_manager_status === 'pending') {
      currentStage = 'operations_manager';
      if (req.user.role === 'operations_manager') {
        canApprove = true;
        nextStage = status === 'approved' ? 'hr_manager' : null;
      }
    } else if (request.operations_manager_status === 'approved' && request.hr_status === 'pending') {
      currentStage = 'hr_manager';
      if (hasHRPrivileges(req.user.role)) {
        canApprove = true;
        nextStage = null;
      }
    } else {
      return res.status(400).json({ error: 'This request has already been fully processed' });
    }
    if (!canApprove) {
      return res.status(403).json({
        error: `Access denied. This request is currently at ${currentStage} stage and requires ${currentStage} approval.`
      });
    }
    const updateData = {};
    if (currentStage === 'area_manager') {
      updateData.area_manager_status = status;
      updateData.area_manager_id = req.user.id;
      updateData.area_manager_updated_at = new Date();
      if (status === 'denied') updateData.status = 'denied';
    } else if (currentStage === 'operations_manager') {
      updateData.operations_manager_status = status;
      updateData.operations_manager_id = req.user.id;
      updateData.operations_manager_updated_at = new Date();
      if (status === 'denied') updateData.status = 'denied';
    } else if (currentStage === 'hr_manager') {
      if (status === 'approved' && request.request_type === 'leave') {
        let balance = await StaffLeaveBalance.findOne({ staff_id: request.staff_id });
        if (!balance) {
          balance = await StaffLeaveBalance.create({
            staff_id: request.staff_id,
            total_leave_days: 20,
            used_leave_days: 0,
            remaining_leave_days: 20
          });
        }
        if (balance.remaining_leave_days < request.number_of_days) {
          return res.status(400).json({
            error: `Insufficient leave days. Staff has ${balance.remaining_leave_days} days remaining, but requested ${request.number_of_days} days.`
          });
        }
        const newUsed = balance.used_leave_days + request.number_of_days;
        const newRemaining = balance.remaining_leave_days - request.number_of_days;
        await StaffLeaveBalance.findByIdAndUpdate(balance._id, {
          used_leave_days: newUsed,
          remaining_leave_days: newRemaining,
          updated_at: new Date()
        });
      }
      updateData.hr_status = status;
      updateData.hr_manager_id = req.user.id;
      updateData.hr_updated_at = new Date();
      updateData.status = status;
    }
    updateData.updated_at = new Date();
    await LeaveRequest.findByIdAndUpdate(requestId, updateData);
    const staffInfo = await User.findById(request.staff_id).select('name');
    const approverInfo = await User.findById(req.user.id).select('name');
    if (status === 'approved' && nextStage) {
      if (nextStage === 'operations_manager') {
        const opsManagers = await User.find({ role: 'operations_manager' }).select('_id');
        for (const opsManager of opsManagers) {
          await HrNotification.create({
            type: 'leave_request_pending',
            message: `Leave request from ${staffInfo?.name} (${request.branch}) needs Operations Manager approval`,
            branch: request.branch,
            manager_id: opsManager._id
          });
        }
      } else if (nextStage === 'hr_manager') {
        const hrManagers = await User.find({ role: { $in: ['hr_manager', 'owner'] } }).select('_id');
        for (const hrManager of hrManagers) {
          await HrNotification.create({
            type: 'leave_request_pending',
            message: `Leave request from ${staffInfo?.name} (${request.branch}) needs HR approval`,
            branch: request.branch,
            manager_id: hrManager._id
          });
        }
      }
    } else if (status === 'denied' && request.manager_id) {
      await HrNotification.create({
        type: 'leave_request_denied',
        message: `Leave request for ${staffInfo?.name} has been denied by ${approverInfo?.name}`,
        branch: request.branch,
        manager_id: request.manager_id
      });
    }
    await logActivity(
      req.user.id,
      approverInfo?.name || 'Approver',
      req.user.role,
      `leave_request_${status}`,
      `${status === 'approved' ? 'Approved' : 'Denied'} leave request for ${staffInfo?.name} at ${currentStage} stage`,
      request.branch,
      { requestId, staffId: request.staff_id, stage: currentStage, status }
    );
    res.json({ message: `Leave request ${status} successfully at ${currentStage} stage` });
  } catch (error) {
    console.error('PUT /api/leave-requests/:id error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function deleteLeaveRequests(req, res) {
  try {
    const match = {};
    let managerBranch = null;
    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      managerBranch = manager.branch;
      match.branch = managerBranch;
    }
    const result = await LeaveRequest.deleteMany(match);
    const userInfo = await User.findById(req.user.id).select('name');
    await logActivity(
      req.user.id,
      userInfo?.name || 'User',
      req.user.role,
      'leave_request_cleared',
      `Cleared all leave requests${managerBranch ? ` for branch ${managerBranch}` : ''}`,
      managerBranch,
      {}
    );
    res.json({ message: 'All leave requests cleared successfully', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('DELETE /api/leave-requests error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
