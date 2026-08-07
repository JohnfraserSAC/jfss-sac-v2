/**
 * Shared role helpers for Exec Dashboard and review UI.
 * Based on global system_roles codes only — not club memberships.
 */

export const EXEC_DASHBOARD_ROLES = [
  "SAC_ADMIN",
  "FACULTY_ADVISOR",
  "SAC_EXEC",
];

export const REVIEW_MUTATOR_ROLES = ["SAC_ADMIN", "FACULTY_ADVISOR"];

/** Narrow exception: SAC_EXEC may mutate today’s school-day override only. */
export const SCHOOL_DAY_MUTATOR_ROLES = ["SAC_ADMIN", "SAC_EXEC"];

export function hasSystemRoleCode(systemRoles, code) {
  return (systemRoles || []).some((role) => role.code === code);
}

export function canAccessExecDashboard(systemRoles) {
  return EXEC_DASHBOARD_ROLES.some((code) =>
    hasSystemRoleCode(systemRoles, code),
  );
}

export function canMutateReviews(systemRoles) {
  return REVIEW_MUTATOR_ROLES.some((code) =>
    hasSystemRoleCode(systemRoles, code),
  );
}

export function canMutateSchoolDay(systemRoles) {
  return SCHOOL_DAY_MUTATOR_ROLES.some((code) =>
    hasSystemRoleCode(systemRoles, code),
  );
}

export function isSacExecRole(systemRoles) {
  return hasSystemRoleCode(systemRoles, "SAC_EXEC");
}

export function isSacAdminRole(systemRoles) {
  return hasSystemRoleCode(systemRoles, "SAC_ADMIN");
}

export function isFacultyAdvisorRole(systemRoles) {
  return hasSystemRoleCode(systemRoles, "FACULTY_ADVISOR");
}
