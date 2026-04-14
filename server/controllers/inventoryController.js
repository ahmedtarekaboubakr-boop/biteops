import { InventoryItem, InventoryTransaction, SpotCheck, User } from '../db.js';
import { logActivity } from '../utils/activityLogger.js';

export async function getInventory(req, res) {
  try {
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    const items = await InventoryItem.find({ branch: manager.branch }).sort({ category: 1, name: 1 });
    res.json(items || []);
  } catch (error) {
    console.error('GET /api/inventory error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createInventory(req, res) {
  try {
    const { itemName, category, quantity, unit, minLevel } = req.body;
    if (!itemName || !category || !unit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    const item = await InventoryItem.create({
      name: itemName,
      category,
      quantity: quantity || 0,
      unit,
      min_level: minLevel || 10,
      branch: manager.branch
    });
    res.status(201).json({ id: item.id, message: 'Item added successfully' });
  } catch (error) {
    console.error('POST /api/inventory error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function receiveStock(req, res) {
  try {
    const { itemId, quantity, notes } = req.body;
    if (!itemId || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    await InventoryItem.findOneAndUpdate(
      { _id: itemId, branch: manager.branch },
      { $inc: { quantity }, updated_at: new Date() }
    );
    await InventoryTransaction.create({
      item_id: itemId,
      type: 'receive',
      quantity,
      notes: notes || '',
      recorded_by: req.user.id,
      branch: manager.branch
    });
    res.json({ message: 'Stock received successfully' });
  } catch (error) {
    console.error('POST /api/inventory/receive error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function transferStock(req, res) {
  try {
    const { itemId, quantity, toBranch, notes } = req.body;
    if (!itemId || !quantity || !toBranch) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    const item = await InventoryItem.findOne({ _id: itemId, branch: manager.branch });
    if (!item || item.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock for transfer' });
    }
    await InventoryItem.findByIdAndUpdate(itemId, {
      $inc: { quantity: -quantity },
      updated_at: new Date()
    });
    await InventoryTransaction.create({
      item_id: itemId,
      type: 'transfer',
      quantity,
      to_branch: toBranch,
      notes: notes || '',
      recorded_by: req.user.id,
      branch: manager.branch,
      status: 'pending'
    });
    const managerInfo = await User.findById(req.user.id).select('name');
    await logActivity(
      req.user.id,
      managerInfo?.name || 'Manager',
      req.user.role,
      'inventory_transfer',
      `Transferred ${quantity} ${item.unit} of ${item.name} from ${manager.branch} to ${toBranch}`,
      manager.branch,
      { itemId, itemName: item.name, quantity, fromBranch: manager.branch, toBranch }
    );
    res.json({ message: 'Transfer recorded successfully' });
  } catch (error) {
    console.error('POST /api/inventory/transfer error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTransfers(req, res) {
  try {
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    const transfers = await InventoryTransaction.find({ type: 'transfer', branch: manager.branch })
      .populate('item_id', 'name unit')
      .populate('recorded_by', 'name')
      .sort({ created_at: -1 })
      .lean();
    res.json((transfers || []).map(t => ({
      ...t,
      id: t._id.toString(),
      item_name: t.item_id?.name,
      unit: t.item_id?.unit,
      recorded_by_name: t.recorded_by?.name,
      date: t.created_at
    })));
  } catch (error) {
    console.error('GET /api/inventory/transfers error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getIncomingTransfers(req, res) {
  try {
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    const transfers = await InventoryTransaction.find({ type: 'transfer', to_branch: manager.branch })
      .populate('item_id', 'name unit category')
      .populate('recorded_by', 'name')
      .sort({ created_at: -1 })
      .lean();
    res.json((transfers || []).map(t => ({
      ...t,
      id: t._id.toString(),
      item_name: t.item_id?.name,
      unit: t.item_id?.unit,
      category: t.item_id?.category,
      from_branch: t.branch,
      recorded_by_name: t.recorded_by?.name,
      date: t.created_at
    })));
  } catch (error) {
    console.error('GET /api/inventory/transfers/incoming error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function respondToTransfer(req, res) {
  try {
    const { id } = req.params;
    const { accepted } = req.body;
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    const transfer = await InventoryTransaction.findById(id)
      .populate('item_id', 'name unit category')
      .lean();
    if (!transfer || transfer.to_branch !== manager.branch || transfer.type !== 'transfer') {
      return res.status(404).json({ error: 'Transfer not found' });
    }
    if (transfer.status !== 'pending') {
      return res.status(400).json({ error: 'Transfer has already been processed' });
    }
    const itemName = transfer.item_id?.name;
    const unit = transfer.item_id?.unit;
    const category = transfer.item_id?.category;
    if (accepted) {
      let receivingItem = await InventoryItem.findOne({
        name: itemName,
        branch: manager.branch
      });
      if (!receivingItem) {
        await InventoryItem.create({
          name: itemName,
          category,
          quantity: transfer.quantity,
          unit,
          min_level: 10,
          branch: manager.branch
        });
      } else {
        await InventoryItem.findByIdAndUpdate(receivingItem._id, {
          $inc: { quantity: transfer.quantity },
          updated_at: new Date()
        });
      }
      await InventoryTransaction.findByIdAndUpdate(id, { status: 'received' });
      const managerInfo = await User.findById(req.user.id).select('name');
      await logActivity(
        req.user.id,
        managerInfo?.name || 'Manager',
        req.user.role,
        'inventory_received',
        `Received ${transfer.quantity} ${unit} of ${itemName} from ${transfer.branch}`,
        manager.branch,
        { itemName, quantity: transfer.quantity, fromBranch: transfer.branch }
      );
      res.json({ message: 'Transfer received and inventory updated' });
    } else {
      await InventoryTransaction.findByIdAndUpdate(id, { status: 'not_received' });
      const itemIdToUpdate = transfer.item_id?._id || transfer.item_id;
      await InventoryItem.findByIdAndUpdate(itemIdToUpdate, {
        $inc: { quantity: transfer.quantity },
        updated_at: new Date()
      });
      const managerInfo = await User.findById(req.user.id).select('name');
      await logActivity(
        req.user.id,
        managerInfo?.name || 'Manager',
        req.user.role,
        'inventory_rejected',
        `Rejected transfer of ${transfer.quantity} ${unit} of ${itemName} from ${transfer.branch}`,
        manager.branch,
        { itemName, quantity: transfer.quantity, fromBranch: transfer.branch }
      );
      res.json({ message: 'Transfer marked as not received, items returned to sender' });
    }
  } catch (error) {
    console.error('PUT /api/inventory/transfers/:id/respond error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function recordWaste(req, res) {
  try {
    const { itemId, quantity, type, reason, notes } = req.body;
    if (!itemId || !quantity || !type || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    const item = await InventoryItem.findOne({ _id: itemId, branch: manager.branch });
    if (!item || item.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    await InventoryItem.findByIdAndUpdate(itemId, {
      $inc: { quantity: -quantity },
      updated_at: new Date()
    });
    await InventoryTransaction.create({
      item_id: itemId,
      type,
      quantity,
      reason,
      notes: notes || '',
      recorded_by: req.user.id,
      branch: manager.branch
    });
    res.json({ message: `${type === 'waste' ? 'Waste' : 'Disposal'} recorded successfully` });
  } catch (error) {
    console.error('POST /api/inventory/waste error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getWaste(req, res) {
  try {
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    const records = await InventoryTransaction.find({
      type: { $in: ['waste', 'dispose'] },
      branch: manager.branch
    })
      .populate('item_id', 'name unit')
      .populate('recorded_by', 'name')
      .sort({ created_at: -1 })
      .lean();
    res.json((records || []).map(r => ({
      ...r,
      id: r._id.toString(),
      item_name: r.item_id?.name,
      unit: r.item_id?.unit,
      recorded_by: r.recorded_by?.name,
      date: r.created_at
    })));
  } catch (error) {
    console.error('GET /api/inventory/waste error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createSpotCheck(req, res) {
  try {
    const { date, checkType, category, itemName, quantity, unit, notes } = req.body;
    if (!date || !checkType || !category || !itemName || quantity === undefined || !unit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!['start_of_day', 'end_of_day'].includes(checkType)) {
      return res.status(400).json({ error: 'Invalid check type' });
    }
    if (!['proteins', 'beverages'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    await SpotCheck.findOneAndUpdate(
      { date, branch: manager.branch, check_type: checkType, category, item_name: itemName },
      {
        date,
        branch: manager.branch,
        manager_id: req.user.id,
        check_type: checkType,
        category,
        item_name: itemName,
        quantity,
        unit,
        notes: notes || ''
      },
      { upsert: true, new: true }
    );
    res.json({ message: 'Spot check recorded successfully' });
  } catch (error) {
    console.error('POST /api/inventory/spot-check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSpotChecks(req, res) {
  try {
    const { date, checkType, category } = req.query;
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    const match = { branch: manager.branch };
    if (date) match.date = date;
    if (checkType) match.check_type = checkType;
    if (category) match.category = category;
    const checks = await SpotCheck.find(match)
      .sort({ date: -1, check_type: 1, category: 1, item_name: 1 });
    res.json(checks || []);
  } catch (error) {
    console.error('GET /api/inventory/spot-check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
