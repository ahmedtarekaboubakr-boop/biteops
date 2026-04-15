import { EquipmentAsset, User } from '../db.js';
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

export async function listAssets(req, res) {
  try {
    const filter = await branchFilter(req);
    const list = await EquipmentAsset.find(filter).sort({ name: 1 }).lean();
    res.json(list.map((r) => ({ ...r, id: r._id.toString() })));
  } catch (e) {
    console.error('listAssets', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createAsset(req, res) {
  try {
    let branch = req.body.branch;
    if (!hasHRPrivileges(req.user.role) && req.user.role !== 'operations_manager' && req.user.role !== 'area_manager') {
      const m = await User.findById(req.user.id).select('branch');
      branch = m?.branch;
    }
    if (!branch || !req.body.name) {
      return res.status(400).json({ error: 'branch and name are required' });
    }
    const doc = await EquipmentAsset.create({
      branch,
      name: req.body.name,
      asset_tag: req.body.asset_tag,
      category: req.body.category,
      serial_number: req.body.serial_number,
      status: req.body.status || 'active',
      purchase_date: req.body.purchase_date,
      last_service_at: req.body.last_service_at
        ? new Date(req.body.last_service_at)
        : undefined,
      next_service_due: req.body.next_service_due,
      notes: req.body.notes,
    });
    res.status(201).json({ id: doc.id });
  } catch (e) {
    console.error('createAsset', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateAsset(req, res) {
  try {
    const filter = { _id: req.params.id };
    const scope = await branchFilter(req);
    if (scope.branch) filter.branch = scope.branch;
    const doc = await EquipmentAsset.findOne(filter);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const fields = [
      'name',
      'asset_tag',
      'category',
      'serial_number',
      'status',
      'purchase_date',
      'next_service_due',
      'notes',
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) doc[f] = req.body[f];
    }
    if (req.body.last_service_at !== undefined) {
      doc.last_service_at = req.body.last_service_at
        ? new Date(req.body.last_service_at)
        : null;
    }
    doc.updated_at = new Date();
    await doc.save();
    res.json({ message: 'Updated' });
  } catch (e) {
    console.error('updateAsset', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteAsset(req, res) {
  try {
    const filter = { _id: req.params.id };
    const scope = await branchFilter(req);
    if (scope.branch) filter.branch = scope.branch;
    if (hasHRPrivileges(req.user.role)) {
      delete filter.branch;
    }
    const r = await EquipmentAsset.deleteOne(filter);
    if (!r.deletedCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('deleteAsset', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}
