import { User } from '../db.js';

function csvEscape(val) {
  if (val == null) return '';
  const s = String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function getPayrollCsv(req, res) {
  try {
    const { branch } = req.query;
    const match = {
      role: { $in: ['staff', 'manager', 'hr_manager', 'operations_manager', 'area_manager'] },
      $or: [{ status: 'active' }, { status: null }],
    };
    if (branch) match.branch = branch;

    const users = await User.find(match)
      .select(
        'name employee_code branch title start_date payroll_info salary username role'
      )
      .sort({ branch: 1, name: 1 })
      .lean();

    const headers = [
      'name',
      'employee_code',
      'branch',
      'title',
      'role',
      'username',
      'start_date',
      'salary',
      'payroll_info',
    ];
    const lines = [headers.join(',')];
    for (const u of users) {
      lines.push(
        [
          csvEscape(u.name),
          csvEscape(u.employee_code),
          csvEscape(u.branch),
          csvEscape(u.title),
          csvEscape(u.role),
          csvEscape(u.username),
          csvEscape(u.start_date),
          csvEscape(u.salary),
          csvEscape(u.payroll_info),
        ].join(',')
      );
    }

    const body = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="payroll-export.csv"');
    res.send('\uFEFF' + body);
  } catch (e) {
    console.error('payroll csv', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
