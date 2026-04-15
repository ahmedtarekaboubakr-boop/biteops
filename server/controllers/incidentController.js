import { IncidentReport, User } from '../db.js';
import { hasHRPrivileges } from '../utils/roleHelpers.js';

async function branchFilter(req) {
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

export async function listIncidents(req, res) {
  try {
    const filter = await branchFilter(req);
    const list = await IncidentReport.find(filter)
      .sort({ reported_at: -1 })
      .limit(200)
      .lean();
    res.json(list.map((r) => ({ ...r, id: r._id.toString() })));
  } catch (e) {
    console.error('listIncidents', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createIncident(req, res) {
  try {
    const { branch, type, severity, description, actions_taken } = req.body;
    if (!type || !description) {
      return res.status(400).json({ error: 'type and description are required' });
    }
    let b = branch;
    if (!hasHRPrivileges(req.user.role) && req.user.role !== 'operations_manager' && req.user.role !== 'area_manager') {
      const m = await User.findById(req.user.id).select('branch');
      b = m?.branch;
    }
    if (!b) {
      return res.status(400).json({ error: 'branch is required' });
    }
    const doc = await IncidentReport.create({
      branch: b,
      type,
      severity: severity || 'low',
      description,
      actions_taken: actions_taken || '',
      reported_by: req.user.id,
    });
    res.status(201).json({ id: doc.id, message: 'Created' });
  } catch (e) {
    console.error('createIncident', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateIncident(req, res) {
  try {
    const filter = { _id: req.params.id };
    const scope = await branchFilter(req);
    if (scope.branch) filter.branch = scope.branch;
    const doc = await IncidentReport.findOne(filter);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const { severity, description, actions_taken } = req.body;
    if (severity != null) doc.severity = severity;
    if (description != null) doc.description = description;
    if (actions_taken != null) doc.actions_taken = actions_taken;
    doc.updated_at = new Date();
    await doc.save();
    res.json({ message: 'Updated' });
  } catch (e) {
    console.error('updateIncident', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteIncident(req, res) {
  try {
    const filter = { _id: req.params.id };
    const scope = await branchFilter(req);
    if (scope.branch) filter.branch = scope.branch;
    if (hasHRPrivileges(req.user.role)) {
      delete filter.branch;
    }
    const r = await IncidentReport.deleteOne(filter);
    if (!r.deletedCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('deleteIncident', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}
