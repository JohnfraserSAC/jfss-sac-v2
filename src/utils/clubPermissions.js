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

export function getMembershipRole(memberships, clubId) {
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

export function isClubMember(role) {
  return role === "MEMBER";
}

export function isClubLeader(role) {
  return isClubOwner(role) || isClubExec(role);
}

export function canManageClubMembers({
  clubRole,
  isSacAdmin = false,
  isSiteAdmin = false,
}) {
  return (
    isSacAdmin ||
    isSiteAdmin ||
    isClubOwner(clubRole) ||
    isClubExec(clubRole)
  );
}

export function getAddableRoles({
  currentUserRole,
  isSacAdmin = false,
  isSiteAdmin = false,
}) {
  if (isSacAdmin || isSiteAdmin || isClubOwner(currentUserRole)) {
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
  isSiteAdmin = false,
}) {
  if (targetRole === "OWNER") {
    return false;
  }

  return getAddableRoles({
    currentUserRole,
    isSacAdmin,
    isSiteAdmin,
  }).includes(targetRole);
}

export function canChangeMemberRole({
  currentUserRole,
  targetCurrentRole,
  targetNewRole,
  isSacAdmin = false,
  isSiteAdmin = false,
}) {
  if (!targetNewRole || targetCurrentRole === targetNewRole) {
    return false;
  }

  if (targetCurrentRole === "OWNER" || targetNewRole === "OWNER") {
    return false;
  }

  if (isSacAdmin || isSiteAdmin || isClubOwner(currentUserRole)) {
    return targetNewRole === "EXEC" || targetNewRole === "MEMBER";
  }

  // EXEC may update MEMBER rows, but RLS only allows keeping role = MEMBER.
  return false;
}

export function canRemoveMember({
  currentUserRole,
  targetRole,
  isSelf = false,
  isSacAdmin = false,
  isSiteAdmin = false,
}) {
  if (targetRole === "OWNER") {
    return false;
  }

  if (isSacAdmin || isSiteAdmin) {
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
