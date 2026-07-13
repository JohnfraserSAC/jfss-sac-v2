import {
  canChangeMemberRole,
  canRemoveMember,
  getClubRoleLabel,
} from "../utils/clubPermissions";
import { formatDate } from "../utils/format";
import { ClubRoleBadge } from "./ClubRoleBadge";
import { MembershipStatusBadge } from "./MembershipStatusBadge";

function memberDisplayName(membership) {
  return (
    membership.profile?.full_name ||
    membership.profile?.email ||
    membership.user_id
  );
}

export function ClubMemberRow({
  membership,
  currentUserId,
  currentUserRole,
  isSacAdmin,
  isSiteAdmin,
  onChangeRole,
  onRemove,
}) {
  const isSelf = membership.user_id === currentUserId;
  const canChange = canChangeMemberRole({
    currentUserRole,
    targetCurrentRole: membership.role,
    targetNewRole: membership.role === "EXEC" ? "MEMBER" : "EXEC",
    isSacAdmin,
    isSiteAdmin,
  });
  const canRemove = canRemoveMember({
    currentUserRole,
    targetRole: membership.role,
    isSelf,
    isSacAdmin,
    isSiteAdmin,
  });

  const addedByLabel =
    membership.added_by_profile?.full_name ||
    membership.added_by_profile?.email ||
    membership.added_by ||
    "—";

  return (
    <tr>
      <td>
        <div className="member-identity">
          <strong>{memberDisplayName(membership)}</strong>
          {membership.profile?.email ? (
            <span>{membership.profile.email}</span>
          ) : (
            <span className="muted">
              User ID: <code>{membership.user_id}</code>
            </span>
          )}
          {isSelf ? <span className="muted">You</span> : null}
        </div>
      </td>
      <td>
        <ClubRoleBadge role={membership.role} />
      </td>
      <td>
        <MembershipStatusBadge status={membership.status} />
      </td>
      <td>{formatDate(membership.joined_at)}</td>
      <td>
        <span className="muted">{addedByLabel}</span>
      </td>
      <td>
        <div className="button-row button-row--compact">
          {canChange ? (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onChangeRole?.(membership)}
            >
              Change role
            </button>
          ) : null}
          {canRemove ? (
            <button
              type="button"
              className="button button--danger"
              onClick={() => onRemove?.(membership)}
            >
              {isSelf ? "Leave club" : "Remove"}
            </button>
          ) : null}
          {!canChange && !canRemove && membership.role === "OWNER" ? (
            <span className="muted">
              {getClubRoleLabel("OWNER")} protected
            </span>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
