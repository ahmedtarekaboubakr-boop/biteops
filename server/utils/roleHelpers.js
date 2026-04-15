/**
 * Roles that can perform HR-style operations (staff CRUD, branches, leave HR stage, etc.)
 */
export function hasHRPrivileges(role) {
  return role === 'hr_manager' || role === 'owner';
}
