import { ActivityLog } from '../db.js';

export const logActivity = async (userId, userName, userRole, actionType, actionDescription, branch = null, details = null) => {
  try {
    await ActivityLog.create({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action_type: actionType,
      action_description: actionDescription,
      branch,
      details: details ? JSON.stringify(details) : null
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
