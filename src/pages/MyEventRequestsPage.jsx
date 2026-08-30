import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { StatusBadge } from "../components/ui/StatusBadge";
import { getMyClubEventRequests } from "../services/clubEvents";
import { formatDate } from "../utils/format";
import { formatDateOnly } from "../utils/torontoDate";
import { getErrorMessage } from "../utils/errors";

export function MyEventRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRequests(await getMyClubEventRequests(user.id));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load your event proposals."));
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional async request fetch
    loadRequests();
  }, [loadRequests]);

  if (loading) {
    return <LoadingScreen message="Loading event proposals…" />;
  }

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Requests</p>
          <h1>Event Proposals</h1>
        </div>
        <Link className="button button--primary" to="/events">
          View events
        </Link>
      </header>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {!error && requests.length === 0 ? (
        <EmptyState
          title="No event proposals yet"
          description="Submit an event proposal from Manage Club to track it here."
        />
      ) : (
        requests.map((request) => (
          <article className="request-card" key={request.id}>
            <div className="request-card__header">
              <div>
                <div className="request-card__labels">
                  <span className="submission-type request-card__type">
                    Event proposal
                  </span>
                  <StatusBadge status={request.status} prefix="Status: " />
                </div>
                <h2>{request.event_name}</h2>
                <p className="muted">{request.clubs?.name}</p>
              </div>
              <time
                className="request-card__date"
                dateTime={request.submitted_at || request.created_at || undefined}
              >
                Submitted {formatDate(request.submitted_at || request.created_at)}
              </time>
            </div>
            <dl className="meta-list">
              <div>
                <dt>Event dates</dt>
                <dd>
                  {formatDateOnly(request.event_date)} –{" "}
                  {formatDateOnly(request.event_end_date)}
                </dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{formatDate(request.updated_at)}</dd>
              </div>
            </dl>
            {request.review_notes ? (
              <div className="request-card__notes">
                <strong>Review notes</strong>
                <p>{request.review_notes}</p>
              </div>
            ) : null}
          </article>
        ))
      )}
    </div>
  );
}
