import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export const requireOwner = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Access denied. Owner role required.' });
  }
  next();
};

export const requireManager = (req, res, next) => {
  const managerRoles = ['manager', 'hr_manager', 'operations_manager', 'area_manager', 'owner'];
  if (!managerRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Manager or Owner role required.' });
  }
  next();
};

export const requireHR = (req, res, next) => {
  if (req.user.role !== 'hr_manager' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Access denied. HR Manager or Owner role required.' });
  }
  next();
};

export { JWT_SECRET };
