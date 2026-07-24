export const CLUB_ROLE_ORDER = {
  OWNER: 0,
  EXEC: 1,
  MEMBER: 2,
};

export const CLUB_ROLE_LABELS = {
  OWNER: "Owner",
  EXEC: "Executive",
  MEMBER: "Member",
};

export function getClubRoleLabel(role) {
  return CLUB_ROLE_LABELS[role] || role || "Unknown";
}

/** Display label for a scoped club membership, e.g. "CS Club Executive". */
export function formatClubScopedRole(clubName, role) {
  const club = String(clubName || "Unknown club").trim() || "Unknown club";
  return `${club} ${getClubRoleLabel(role)}`;
}

export function isSacAdmin(systemRoles) {
  return (systemRoles || []).some((role) => role.code === "SAC_ADMIN");
}

export function getMembershipRole(memberships, clubId) {
  return getClubRole(memberships, clubId);
}

export function getClubRole(memberships, clubId) {
  const match = (memberships || []).find(
    (membership) => membership.club_id === clubId,
  );
  return match?.role ?? null;
}

export function isClubOwner(role) {
  return role === "OWNER";
}

export function isClubExec(role) {
  return role === "EXEC";
}

export function isClubExecutive(role) {
  return isClubExec(role);
}

export function isClubMember(role) {
  return role === "MEMBER";
}

export function isClubLeader(role) {
  return isClubOwner(role) || isClubExec(role);
}

export function canManageClubMembers({ clubRole, isSacAdmin = false }) {
  return isSacAdmin || isClubOwner(clubRole) || isClubExec(clubRole);
}

export function canSearchStudents({ clubRole, isSacAdmin = false }) {
  return isSacAdmin || isClubOwner(clubRole) || isClubExec(clubRole);
}

export function getAddableRoles({ currentUserRole, isSacAdmin = false }) {
  if (isSacAdmin || isClubOwner(currentUserRole)) {
    return ["EXEC", "MEMBER"];
  }

  if (isClubExec(currentUserRole)) {
    return ["MEMBER"];
  }

  return [];
}

export function canAddRole({
  currentUserRole,
  targetRole,
  isSacAdmin = false,
}) {
  return canAddClubRole({
    currentUserRole,
    newRole: targetRole,
    isSacAdmin,
  });
}

export function canAddClubRole({
  currentUserRole,
  newRole,
  isSacAdmin = false,
}) {
  if (newRole === "OWNER") {
    return false;
  }

  return getAddableRoles({
    currentUserRole,
    isSacAdmin,
  }).includes(newRole);
}

export function canChangeMemberRole({
  currentUserRole,
  targetCurrentRole,
  targetNewRole,
  isSacAdmin = false,
}) {
  return canChangeClubRole({
    currentUserRole,
    targetRole: targetCurrentRole,
    newRole: targetNewRole,
    isSacAdmin,
  });
}

export function canChangeClubRole({
  currentUserRole,
  targetRole,
  targetCurrentRole,
  newRole,
  targetNewRole,
  isSacAdmin = false,
}) {
  const currentTargetRole = targetCurrentRole ?? targetRole;
  const nextRole = targetNewRole ?? newRole;

  if (!nextRole || currentTargetRole === nextRole) {
    return false;
  }

  if (currentTargetRole === "OWNER" || nextRole === "OWNER") {
    return false;
  }

  // EXEC may only keep MEMBER as MEMBER (reactivation), not promote/demote.
  if (isSacAdmin || isClubOwner(currentUserRole)) {
    return nextRole === "EXEC" || nextRole === "MEMBER";
  }

  return false;
}

export function canRemoveMember({
  currentUserRole,
  targetRole,
  isSelf = false,
  isSacAdmin = false,
}) {
  return canRemoveClubMember({
    currentUserRole,
    targetRole,
    isSelf,
    isSacAdmin,
  });
}

export function canRemoveClubMember({
  currentUserRole,
  targetRole,
  isSelf = false,
  isSacAdmin = false,
}) {
  if (targetRole === "OWNER") {
    return false;
  }

  if (isSacAdmin) {
    return true;
  }

  if (isClubOwner(currentUserRole)) {
    return targetRole === "EXEC" || targetRole === "MEMBER";
  }

  if (isClubExec(currentUserRole)) {
    return targetRole === "MEMBER";
  }

  if (isSelf && (targetRole === "EXEC" || targetRole === "MEMBER")) {
    return true;
  }

  return false;
}

export function sortClubMemberships(memberships) {
  return [...(memberships || [])].sort((a, b) => {
    const roleDiff =
      (CLUB_ROLE_ORDER[a.role] ?? 99) - (CLUB_ROLE_ORDER[b.role] ?? 99);

    if (roleDiff !== 0) return roleDiff;

    const aLabel = (
      a.profile?.full_name ||
      a.profile?.email ||
      a.user_id ||
      ""
    ).toLowerCase();
    const bLabel = (
      b.profile?.full_name ||
      b.profile?.email ||
      b.user_id ||
      ""
    ).toLowerCase();

    return aLabel.localeCompare(bLabel);
  });
}

export function normalizePdsbEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function getEmailDomain(email) {
  return normalizePdsbEmail(email).split("@").pop() || "";
}

export function isValidPdsbEmail(email) {
  const normalized = normalizePdsbEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return false;
  }
  return getEmailDomain(normalized) === "pdsb.net";
}
