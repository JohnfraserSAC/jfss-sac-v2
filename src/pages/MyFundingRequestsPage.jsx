import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { StatusBadge } from "../components/ui/StatusBadge";
import { getMyFundingRequests } from "../services/clubFunding";
import { isClubOwner } from "../utils/clubPermissions";
import { getErrorMessage } from "../utils/errors";
import { formatDate } from "../utils/format";

export function MyFundingRequestsPage() {
  const { memberships = [], tabs = [] } = useOutletContext() || {};
  const { user } = useAuth();
  const canView = tabs.some((tab) => tab.id === "funding");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canView || !user?.id) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const rows = await getMyFundingRequests(user.id);
        if (active) setRequests(rows);
      } catch (loadError) {
        if (active) {
          setError(
            getErrorMessage(loadError, "Could not load your funding requests."),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [canView, user?.id]);

  const leaderClubs = useMemo(
    () =>
      (memberships || [])
        .filter(
          (membership) =>
            membership.status === "ACTIVE" &&
            isClubOwner(membership.role) &&
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

  if (loading) {
    return <LoadingScreen message="Loading funding requests…" />;
  }

  return (
    <div className="stack">
      <section className="panel">
        <h2>Club funding</h2>
        <p className="muted">Track funding requests submitted for your clubs.</p>
      </section>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      {leaderClubs.length === 0 ? (
        <EmptyState title="No funding clubs yet">
          Funding requests are available for clubs where you are an active
          owner.
        </EmptyState>
      ) : (
        <section className="panel">
          <h3>Your clubs</h3>
          <ul className="stack">
            {leaderClubs.map((club) => (
              <li key={club.id}>
                <Link
                  className="text-link"
                  to={`/clubs/${club.slug}/manage?tab=funding`}
                >
                  {club.name}
                </Link>
                <span className="muted"> · Submit a funding request</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {requests.length > 0 ? (
        <section className="panel">
          <h3>Submitted requests</h3>
          <ul className="stack">
            {requests.map((request) => (
              <li key={request.id} className="funding-request-summary">
                <div className="funding-request-summary__main">
                  <div className="request-card__labels">
                    <span className="submission-type funding-request-summary__type">
                      Funding request
                    </span>
                    <StatusBadge status={request.status} prefix="Status: " />
                  </div>
                  <strong>{request.clubs?.name || "Club funding request"}</strong>
                </div>
                <div className="funding-request-summary__meta">
                  <time
                    className="request-card__date"
                    dateTime={request.submitted_at || request.created_at || undefined}
                  >
                    Submitted {formatDate(request.submitted_at || request.created_at)}
                  </time>
                  <strong>
                    ${Number(request.total_amount || 0).toFixed(2)}
                  </strong>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
