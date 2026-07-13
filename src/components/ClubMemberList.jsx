import { EmptyState } from "./EmptyState";
import { ClubMemberRow } from "./ClubMemberRow";

export function ClubMemberList({
  memberships,
  currentUserId,
  currentUserRole,
  isSacAdmin,
  isSiteAdmin,
  onChangeRole,
  onRemove,
}) {
  if (!memberships?.length) {
    return (
      <EmptyState title="No memberships yet">
        This club does not have any membership rows yet.
      </EmptyState>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Member</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">Joined</th>
            <th scope="col">Added by</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {memberships.map((membership) => (
            <ClubMemberRow
              key={`${membership.club_id}-${membership.user_id}`}
              membership={membership}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              isSacAdmin={isSacAdmin}
              isSiteAdmin={isSiteAdmin}
              onChangeRole={onChangeRole}
              onRemove={onRemove}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
