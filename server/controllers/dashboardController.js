import {
  User,
  LeaveRequest,
  Rating,
  Penalty,
  AttendanceRecord,
} from '../db.js';

export async function getKpis(req, res) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toISOString().split('T')[0];

    const [
      staffActive,
      managersCount,
      pendingLeave,
      ratings7d,
      penalties7d,
      attendance7d,
    ] = await Promise.all([
      User.countDocuments({
        role: 'staff',
        $or: [{ status: 'active' }, { status: null }],
      }),
      User.countDocuments({
        role: { $in: ['manager', 'hr_manager', 'operations_manager', 'area_manager'] },
        $or: [{ status: 'active' }, { status: null }],
      }),
      LeaveRequest.countDocuments({ status: 'pending' }),
      Rating.countDocuments({ created_at: { $gte: since } }),
      Penalty.countDocuments({ date: { $gte: sinceStr } }),
      AttendanceRecord.countDocuments({ date: { $gte: sinceStr } }),
    ]);

    let ratingAvg = null;
    const agg = await Rating.aggregate([
      { $match: { created_at: { $gte: since } } },
      { $group: { _id: null, avg: { $avg: '$total_score' } } },
    ]);
    if (agg.length && agg[0].avg != null) {
      ratingAvg = Math.round(agg[0].avg * 10) / 10;
    }

    res.json({
      headcountStaff: staffActive,
      headcountManagers: managersCount,
      pendingLeaveRequests: pendingLeave,
      ratingsLast7Days: ratings7d,
      ratingAvgLast7Days: ratingAvg,
      penaltiesLast7Days: penalties7d,
      attendanceRecordsLast7Days: attendance7d,
    });
  } catch (e) {
    console.error('GET /api/dashboard/kpis', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
