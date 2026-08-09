import { useMemo } from "react";
import { Link, Navigate, useOutletContext } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { isClubLeader } from "../utils/clubPermissions";

export function MyFundingRequestsPage() {
  const { memberships = [], tabs = [] } = useOutletContext() || {};
  const canView = tabs.some((tab) => tab.id === "funding");

  const leaderClubs = useMemo(
    () =>
      (memberships || [])
        .filter(
          (membership) =>
            membership.status === "ACTIVE" &&
            isClubLeader(membership.role) &&
            membership.clubs &&
            membership.clubs.status === "APPROVED" &&
            !membership.clubs.deleted_at,
        )
        .map((membership) => membership.clubs),
    [memberships],
  );

  if (!canView) {
    return <Navigate to="/my-requests/applications" replace />;
  }

  return (
    <div className="stack">
      <section className="panel">
        <h2>Club funding</h2>
        <p className="muted">
          Club funding submissions are coming soon. When available, requests
          will be tracked in this tab.
        </p>
      </section>

      {leaderClubs.length === 0 ? (
        <EmptyState title="No funding clubs yet">
          Funding requests will be available for clubs where you are an owner
          or executive.
        </EmptyState>
      ) : (
        <section className="panel">
          <h3>Your clubs</h3>
          <ul className="stack">
            {leaderClubs.map((club) => (
              <li key={club.id}>
                <Link
                  className="text-link"
                  to={`/clubs/${club.slug}/manage/funding`}
                >
                  {club.name}
                </Link>
                <span className="muted"> · Open funding placeholder</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
