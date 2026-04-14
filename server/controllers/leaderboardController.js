import { User, Rating, AttendanceRecord, Penalty } from '../db.js';

export async function getStaffLeaderboard(req, res) {
  try {
    const { days } = req.query;
    const daysNum = days === 'all' ? null : parseInt(days) || 30;

    const dateFilter = daysNum ? (() => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);
      return startDate.toISOString().split('T')[0];
    })() : null;

    const user = await User.findById(req.user.id).select('branch');
    if (!user || !user.branch) {
      return res.status(400).json({ error: 'Branch not found' });
    }

    const staff = await User.find({
      branch: user.branch,
      role: 'staff',
      status: 'active'
    })
      .select('name employee_code branch')
      .sort({ name: 1 })
      .lean();

    if (staff.length === 0) {
      return res.json([]);
    }

    const leaderboard = [];

    for (const staffMember of staff) {
      const staffId = staffMember._id;

      const ratingsMatch = { staff_id: staffId };
      if (dateFilter) ratingsMatch.date = { $gte: dateFilter };
      const ratingsAgg = await Rating.aggregate([
        { $match: ratingsMatch },
        {
          $group: {
            _id: null,
            avg_performance: { $avg: '$performance' },
            avg_total_score: { $avg: '$total_score' },
            rating_count: { $sum: 1 }
          }
        }
      ]);
      const ratings = ratingsAgg[0] || null;

      const attendanceMatch = { staff_id: staffId };
      if (dateFilter) attendanceMatch.date = { $gte: dateFilter };
      const attendanceAgg = await AttendanceRecord.aggregate([
        { $match: attendanceMatch },
        {
          $group: {
            _id: null,
            total_days: { $sum: 1 },
            present_days: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
          }
        }
      ]);
      const attendance = attendanceAgg[0] || null;

      const penaltyMatch = { staff_id: staffId, status: 'active' };
      if (dateFilter) penaltyMatch.date = { $gte: dateFilter };
      const penalties = await Penalty.countDocuments(penaltyMatch);

      let overallScore = 0;

      if (ratings && ratings.rating_count > 0) {
        const perfScore = (ratings.avg_performance / 5.0) * 40;
        const totalScore = (ratings.avg_total_score / 10.0) * 30;
        overallScore += perfScore + totalScore;
      }

      if (attendance && attendance.total_days > 0) {
        const attendanceRate = (attendance.present_days / attendance.total_days) * 100;
        const attendanceScore = (attendanceRate / 100) * 30;
        overallScore += attendanceScore;
      }

      overallScore -= penalties * 2;
      overallScore = Math.max(0, Math.min(100, overallScore));

      leaderboard.push({
        staff_id: staffId.toString(),
        staff_name: staffMember.name,
        employee_code: staffMember.employee_code,
        avg_performance: ratings?.avg_performance || null,
        avg_total_score: ratings?.avg_total_score || null,
        attendance_rate: attendance && attendance.total_days > 0
          ? (attendance.present_days / attendance.total_days) * 100
          : null,
        penalty_count: penalties,
        overall_score: overallScore
      });
    }

    leaderboard.sort((a, b) => {
      if (a.avg_performance !== null && b.avg_performance !== null) {
        if (b.avg_performance !== a.avg_performance) {
          return b.avg_performance - a.avg_performance;
        }
        return b.overall_score - a.overall_score;
      }
      if (a.avg_performance !== null && b.avg_performance === null) return -1;
      if (a.avg_performance === null && b.avg_performance !== null) return 1;
      return b.overall_score - a.overall_score;
    });

    res.json(leaderboard);
  } catch (error) {
    console.error('GET /api/leaderboard/staff error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

export async function getBranchesLeaderboard(req, res) {
  try {
    const { days } = req.query;
    const daysNum = days === 'all' ? null : parseInt(days) || 30;

    const dateFilter = daysNum ? (() => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);
      return startDate.toISOString().split('T')[0];
    })() : null;

    const branchRows = await User.distinct('branch', { branch: { $nin: [null, ''] } });

    if (branchRows.length === 0) {
      return res.json([]);
    }

    const leaderboard = [];

    for (const branchName of branchRows) {
      const branchStaff = await User.find({
        branch: branchName,
        role: 'staff',
        status: 'active'
      }).select('_id').lean();

      if (branchStaff.length === 0) continue;

      const staffIds = branchStaff.map(s => s._id);

      const ratingsMatch = { staff_id: { $in: staffIds } };
      if (dateFilter) ratingsMatch.date = { $gte: dateFilter };
      const ratingsAgg = await Rating.aggregate([
        { $match: ratingsMatch },
        {
          $group: {
            _id: null,
            avg_performance: { $avg: '$performance' },
            rating_count: { $sum: 1 }
          }
        }
      ]);
      const ratings = ratingsAgg[0] || null;

      const attendanceMatch = { staff_id: { $in: staffIds } };
      if (dateFilter) attendanceMatch.date = { $gte: dateFilter };
      const attendanceAgg = await AttendanceRecord.aggregate([
        { $match: attendanceMatch },
        {
          $group: {
            _id: null,
            total_days: { $sum: 1 },
            present_days: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
          }
        }
      ]);
      const attendance = attendanceAgg[0] || null;

      const penaltyMatch = { staff_id: { $in: staffIds }, status: 'active' };
      if (dateFilter) penaltyMatch.date = { $gte: dateFilter };
      const penaltyCount = await Penalty.countDocuments(penaltyMatch);

      let overallScore = 0;

      if (ratings && ratings.rating_count > 0) {
        const perfScore = (ratings.avg_performance / 5.0) * 50;
        overallScore += perfScore;
      }

      if (attendance && attendance.total_days > 0) {
        const attendanceRate = (attendance.present_days / attendance.total_days) * 100;
        const attendanceScore = (attendanceRate / 100) * 50;
        overallScore += attendanceScore;
      }

      overallScore -= penaltyCount * 1;
      overallScore = Math.max(0, Math.min(100, overallScore));

      leaderboard.push({
        branch: branchName,
        avg_performance: ratings?.avg_performance || null,
        avg_attendance_rate: attendance && attendance.total_days > 0
          ? (attendance.present_days / attendance.total_days) * 100
          : null,
        total_penalties: penaltyCount,
        staff_count: branchStaff.length,
        overall_score: overallScore
      });
    }

    leaderboard.sort((a, b) => b.overall_score - a.overall_score);

    res.json(leaderboard);
  } catch (error) {
    console.error('GET /api/leaderboard/branches error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
