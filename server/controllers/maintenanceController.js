import { MaintenanceItem, User } from '../db.js';
import { logActivity } from '../utils/activityLogger.js';
import { getAreaManagerBranches } from '../utils/getAreaManagerBranches.js';

function mapItem(item) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description,
    quantity: item.quantity,
    branch: item.branch,
    status: item.status,
    notes: item.notes,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
}

export async function getMaintenance(req, res) {
  try {
    let branch = req.query.branch;

    if (req.user.role === 'owner' || req.user.role === 'operations_manager') {
      let query = {};
      if (branch) {
        query.branch = branch;
      }
      const items = await MaintenanceItem.find(query).sort({ branch: 1, category: 1, name: 1 });
      return res.json(items.map(mapItem));
    }

    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      branch = manager.branch;
    } else if (req.user.role === 'area_manager') {
      const areaManager = await User.findById(req.user.id).select('area');
      if (!areaManager || !areaManager.area) {
        return res.status(400).json({ error: 'Area manager area not found' });
      }
      const assignedBranches = getAreaManagerBranches(areaManager.area);
      if (!branch || !assignedBranches.includes(branch)) {
        const items = await MaintenanceItem.find({ branch: { $in: assignedBranches } }).sort({ category: 1, name: 1 });
        return res.json(items.map(mapItem));
      }
    }

    if (!branch) {
      return res.status(400).json({ error: 'Branch is required' });
    }

    const items = await MaintenanceItem.find({ branch }).sort({ category: 1, name: 1 });
    res.json(items.map(mapItem));
  } catch (error) {
    console.error('GET /api/maintenance error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function createMaintenance(req, res) {
  try {
    const { name, category, description, quantity, branch: branchParam, status, notes } = req.body;

    if (!name || !category || !branchParam) {
      return res.status(400).json({ error: 'Name, category, and branch are required' });
    }

    const validCategories = ['machinery', 'cleaning_supplies', 'electronics', 'supplies', 'furniture'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const item = await MaintenanceItem.create({
      name,
      category,
      description: description || null,
      quantity: quantity || 1,
      branch: branchParam,
      status: status || 'active',
      notes: notes || null
    });

    try {
      await logActivity(
        req.user.id,
        req.user.name || 'User',
        req.user.role,
        'maintenance_item_created',
        `Created maintenance item: ${name} (${category}) at ${branchParam}`,
        branchParam,
        { itemName: name, category, quantity: quantity || 1 }
      );
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(201).json(mapItem(item));
  } catch (error) {
    console.error('POST /api/maintenance error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function updateMaintenance(req, res) {
  try {
    const { name, category, description, quantity, status, notes } = req.body;
    const itemId = req.params.id;

    const existingItem = await MaintenanceItem.findById(itemId);
    if (!existingItem) {
      return res.status(404).json({ error: 'Maintenance item not found' });
    }

    if (category) {
      const validCategories = ['machinery', 'cleaning_supplies', 'electronics', 'supplies', 'furniture'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updated_at = new Date();

    const updatedItem = await MaintenanceItem.findByIdAndUpdate(itemId, updateData, { new: true });

    try {
      await logActivity(
        req.user.id,
        req.user.name || 'User',
        req.user.role,
        'maintenance_item_updated',
        `Updated maintenance item: ${updatedItem.name} at ${updatedItem.branch}`,
        updatedItem.branch,
        { itemId, itemName: updatedItem.name }
      );
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.json(mapItem(updatedItem));
  } catch (error) {
    console.error('PUT /api/maintenance/:id error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function deleteMaintenance(req, res) {
  try {
    const itemId = req.params.id;

    const existingItem = await MaintenanceItem.findById(itemId);
    if (!existingItem) {
      return res.status(404).json({ error: 'Maintenance item not found' });
    }

    await MaintenanceItem.findByIdAndDelete(itemId);

    try {
      await logActivity(
        req.user.id,
        req.user.name || 'User',
        req.user.role,
        'maintenance_item_deleted',
        `Deleted maintenance item: ${existingItem.name} from ${existingItem.branch}`,
        existingItem.branch,
        { itemId, itemName: existingItem.name }
      );
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.json({ message: 'Maintenance item deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/maintenance/:id error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
