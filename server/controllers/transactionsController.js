import { FinancialTransaction, User } from '../db.js';

export async function getTransactions(req, res) {
  try {
    const { startDate, endDate, type } = req.query;
    let query = {};
    
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    query.branch = manager.branch;
    
    if (startDate) {
      query.created_at = { ...query.created_at, $gte: new Date(startDate) };
    }
    if (endDate) {
      query.created_at = { ...query.created_at, $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
    }
    if (type) query.type = type;
    
    const transactions = await FinancialTransaction.find(query)
      .populate('recorded_by', 'name')
      .sort({ created_at: -1 })
      .lean();
    res.json(transactions.map(t => ({
      ...t,
      id: t._id.toString(),
      recorded_by_name: t.recorded_by?.name || null
    })) || []);
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getSummary(req, res) {
  try {
    const { date } = req.query;
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    const dateToUse = date || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(dateToUse);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateToUse);
    endOfDay.setHours(23, 59, 59, 999);

    const results = await FinancialTransaction.aggregate([
      {
        $match: {
          branch: manager.branch,
          created_at: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const summary = {};
    results.forEach(row => {
      summary[row._id] = row.total;
    });
    res.json(summary);
  } catch (error) {
    console.error('GET /api/transactions/summary error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function createTransaction(req, res) {
  try {
    const { type, amount, reference, description } = req.body;
    if (!type || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const validTypes = ['revenue_cash', 'revenue_card', 'petty_cash', 'fine', 'deposit', 'void', 'complimentary'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }
    
    const manager = await User.findById(req.user.id).select('branch');
    if (!manager || !manager.branch) {
      return res.status(400).json({ error: 'Manager branch not found' });
    }
    
    const transaction = await FinancialTransaction.create({
      type,
      amount: parseFloat(amount),
      reference: reference || null,
      description: description || null,
      recorded_by: req.user.id,
      branch: manager.branch
    });
    
    res.status(201).json({ id: transaction.id, message: 'Transaction added successfully' });
  } catch (error) {
    console.error('POST /api/transactions error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
