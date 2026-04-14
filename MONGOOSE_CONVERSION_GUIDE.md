# Mongoose Conversion Guide

## Pattern for Converting SQLite to Mongoose

### Import Changes
```javascript
// OLD
import { dbGet, dbRun, dbAll } from '../db.js';

// NEW
import { User, Schedule, Rating, /* other models */ } from '../db.js';
```

### Query Conversions

#### SELECT (dbGet - single row)
```javascript
// OLD
const user = await dbGet("SELECT * FROM users WHERE id = ?", [userId]);

// NEW
const user = await User.findById(userId);
// OR
const user = await User.findOne({ username: 'john' });
```

#### SELECT (dbAll - multiple rows)
```javascript
// OLD
const users = await dbAll("SELECT * FROM users WHERE role = ?", ['staff']);

// NEW
const users = await User.find({ role: 'staff' });
```

#### INSERT (dbRun)
```javascript
// OLD
const result = await dbRun(
  "INSERT INTO users (name, email) VALUES (?, ?)",
  [name, email]
);
const newId = result.lastID;

// NEW
const user = await User.create({ name, email });
const newId = user._id; // or user.id (virtual)
```

#### UPDATE (dbRun)
```javascript
// OLD
await dbRun("UPDATE users SET name = ? WHERE id = ?", [newName, userId]);

// NEW
await User.findByIdAndUpdate(userId, { name: newName });
// OR
await User.updateOne({ _id: userId }, { name: newName });
```

#### DELETE (dbRun)
```javascript
// OLD
await dbRun("DELETE FROM users WHERE id = ?", [userId]);

// NEW
await User.findByIdAndDelete(userId);
// OR
await User.deleteOne({ _id: userId });
```

### JOIN Queries
```javascript
// OLD
const schedules = await dbAll(`
  SELECT s.*, u.name as staff_name
  FROM schedules s
  JOIN users u ON s.staff_id = u.id
  WHERE s.branch = ?
`, [branch]);

// NEW - Option 1: Populate
const schedules = await Schedule.find({ branch })
  .populate('staff_id', 'name employee_code');

// NEW - Option 2: Aggregate
const schedules = await Schedule.aggregate([
  { $match: { branch } },
  {
    $lookup: {
      from: 'users',
      localField: 'staff_id',
      foreignField: '_id',
      as: 'staff'
    }
  },
  { $unwind: '$staff' }
]);
```

### Error Handling
```javascript
// OLD - UNIQUE constraint
if (err.message && err.message.includes('UNIQUE constraint')) {
  return res.status(400).json({ error: 'Already exists' });
}

// NEW - Mongoose duplicate key
if (err.code === 11000) {
  return res.status(400).json({ error: 'Already exists' });
}
```

### ID Handling
- SQLite uses integer `id`
- MongoDB uses ObjectId `_id`
- Our models have a virtual `id` that returns `_id.toString()`
- Use `req.user.id` (from JWT) with `findById()` - it works with string IDs
- Response: `user.id` or `user._id.toString()` both work

### Aggregation for GROUP BY
```javascript
// OLD
const summary = await dbAll(`
  SELECT type, SUM(amount) as total
  FROM transactions
  WHERE branch = ?
  GROUP BY type
`, [branch]);

// NEW
const summary = await FinancialTransaction.aggregate([
  { $match: { branch } },
  {
    $group: {
      _id: '$type',
      total: { $sum: '$amount' }
    }
  }
]);
```
