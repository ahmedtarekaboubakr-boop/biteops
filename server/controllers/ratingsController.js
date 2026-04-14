import { Rating, AttendanceRecord, User } from '../db.js';

export async function getRatings(req, res) {
  try {
    const { startDate, endDate, staffId } = req.query;
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

    const ratings = await Rating.find(match)
      .populate('staff_id', 'name employee_code status')
      .populate('manager_id', 'name')
      .sort({ date: -1, 'staff_id.name': 1 })
      .lean();

    const filtered = ratings.filter(r => r.staff_id && (r.staff_id.status === 'active' || r.staff_id.status == null));
    res.json(filtered.map(r => ({
      ...r,
      id: r._id.toString(),
      staff_name: r.staff_id?.name,
      employee_code: r.staff_id?.employee_code,
      manager_name: r.manager_id?.name
    })));
  } catch (error) {
    console.error('Get ratings error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}

export async function createRating(req, res) {
  try {
    let {
      staffId,
      date,
      nailsCut,
      beardShaved,
      cleanTshirt,
      blackPants,
      correctFootwear,
      performance,
      notes
    } = req.body;

    if (!staffId || !date || performance === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (performance < 0 || performance > 5) {
      return res.status(400).json({ error: 'Performance must be between 0 and 5' });
    }

    const attendance = await AttendanceRecord.findOne({ staff_id: staffId, date })
      .select('late_minutes status');
    const isLate = attendance && (attendance.late_minutes > 0 || attendance.status === 'late');
    if (isLate) {
      nailsCut = false;
      beardShaved = false;
      cleanTshirt = false;
      blackPants = false;
      correctFootwear = false;
    }

    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      const now = new Date();
      const lockTime = new Date();
      lockTime.setHours(16, 30, 0, 0);
      if (now >= lockTime) {
        const existingLock = await Rating.findOne({
          staff_id: staffId,
          date,
          manager_id: req.user.id
        }).select('nails_cut beard_shaved clean_tshirt black_pants correct_footwear');
        if (existingLock) {
          nailsCut = existingLock.nails_cut === 1;
          beardShaved = existingLock.beard_shaved === 1;
          cleanTshirt = existingLock.clean_tshirt === 1;
          blackPants = existingLock.black_pants === 1;
          correctFootwear = existingLock.correct_footwear === 1;
        }
      }
    }

    const hygieneGroomingScore =
      (nailsCut ? 1 : 0) +
      (beardShaved ? 1 : 0) +
      (cleanTshirt ? 1 : 0) +
      (blackPants ? 1 : 0) +
      (correctFootwear ? 1 : 0);
    const totalScore = hygieneGroomingScore + performance;

    const ratingData = {
      nails_cut: nailsCut ? 1 : 0,
      beard_shaved: beardShaved ? 1 : 0,
      clean_tshirt: cleanTshirt ? 1 : 0,
      black_pants: blackPants ? 1 : 0,
      correct_footwear: correctFootwear ? 1 : 0,
      performance,
      total_score: totalScore,
      notes: notes || ''
    };

    if (req.user.role === 'manager') {
      const manager = await User.findById(req.user.id).select('branch');
      if (!manager || !manager.branch) {
        return res.status(400).json({ error: 'Manager branch not found' });
      }
      const staff = await User.findOne({
        _id: staffId,
        role: 'staff',
        $or: [{ status: 'active' }, { status: null }]
      }).select('branch');
      if (!staff) {
        return res.status(404).json({ error: 'Staff not found or inactive' });
      }
      if (staff.branch !== manager.branch) {
        return res.status(403).json({ error: 'Access denied. You can only rate staff from your branch.' });
      }
      const existing = await Rating.findOne({
        staff_id: staffId,
        date,
        manager_id: req.user.id
      });
      if (existing) {
        await Rating.findByIdAndUpdate(existing._id, { ...ratingData, updated_at: new Date() });
        res.json({ message: 'Rating updated successfully', id: existing.id });
      } else {
        const rating = await Rating.create({
          staff_id: staffId,
          date,
          manager_id: req.user.id,
          branch: manager.branch,
          ...ratingData
        });
        res.status(201).json({ message: 'Rating created successfully', id: rating.id });
      }
    } else {
      const staff = await User.findOne({
        _id: staffId,
        role: 'staff',
        $or: [{ status: 'active' }, { status: null }]
      }).select('branch');
      if (!staff) {
        return res.status(404).json({ error: 'Staff not found or inactive' });
      }
      const existing = await Rating.findOne({
        staff_id: staffId,
        date,
        manager_id: req.user.id
      });
      if (existing) {
        await Rating.findByIdAndUpdate(existing._id, { ...ratingData, updated_at: new Date() });
        res.json({ message: 'Rating updated successfully', id: existing.id });
      } else {
        const rating = await Rating.create({
          staff_id: staffId,
          date,
          manager_id: req.user.id,
          branch: staff.branch,
          ...ratingData
        });
        res.status(201).json({ message: 'Rating created successfully', id: rating.id });
      }
    }
  } catch (error) {
    console.error('POST /api/ratings error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getRatingByStaffAndDate(req, res) {
  try {
    const { staffId, date } = req.params;
    const rating = await Rating.findOne({
      staff_id: staffId,
      date,
      manager_id: req.user.id
    })
      .populate('staff_id', 'name employee_code')
      .lean();
    if (!rating) {
      return res.status(404).json({ error: 'Rating not found' });
    }
    res.json({
      ...rating,
      id: rating._id.toString(),
      staff_name: rating.staff_id?.name,
      employee_code: rating.staff_id?.employee_code
    });
  } catch (error) {
    console.error('GET /api/ratings/:staffId/:date error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
