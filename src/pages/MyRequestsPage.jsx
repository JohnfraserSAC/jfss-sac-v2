import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { RequestCard } from "../components/RequestCard";
import { StatusBadge } from "../components/StatusBadge";
import { Spinner } from "../components/Spinner";
import {
  deleteDraftClubRequest,
  getMyClubRequests,
  resubmitClubRequest,
  withdrawClubRequest,
} from "../services/clubRequests";
import { getMyClubReapplications } from "../services/clubReapplications";
import { getMyClubEventRequests } from "../services/clubEventRequests";
import { getClubById } from "../services/clubs";
import { formatDate } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

export function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [reapplications, setReapplications] = useState([]);
  const [eventRequests, setEventRequests] = useState([]);
  const [clubSlugs, setClubSlugs] = useState({});
  const [missingClubs, setMissingClubs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [data, reapps, events] = await Promise.all([
        getMyClubRequests(user.id),
        getMyClubReapplications(user.id).catch(() => []),
        getMyClubEventRequests(user.id).catch(() => []),
      ]);
      setRequests(data);
      setReapplications(reapps);
      setEventRequests(events);

      const approved = data.filter((request) => request.created_club_id);
      const slugEntries = await Promise.all(
        approved.map(async (request) => {
          try {
            const club = await getClubById(request.created_club_id);
            return [request.created_club_id, club?.slug ?? null, !club];
          } catch {
            return [request.created_club_id, null, true];
          }
        }),
      );
      setClubSlugs(
        Object.fromEntries(slugEntries.map(([id, slug]) => [id, slug])),
      );
      setMissingClubs(
        Object.fromEntries(
          slugEntries.map(([id, , missing]) => [id, Boolean(missing)]),
        ),
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load your requests."));
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function runAction(requestId, action) {
    setBusyId(requestId);
    setActionError("");

    try {
      await action();
      await loadRequests();
    } catch (actionErr) {
      setActionError(getErrorMessage(actionErr, "Action failed."));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading your requests…" />;
  }

  const hasAny =
    requests.length > 0 ||
    reapplications.length > 0 ||
    eventRequests.length > 0;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Your applications</p>
          <h1>My requests</h1>
          <p className="lede">
            Track new club applications, re-applications, and event proposals
            you have submitted.
          </p>
        </div>
        <div className="button-row">
          <Link className="button button--secondary" to="/clubs/apply">
            Apply for a new club
          </Link>
          <Link className="button button--secondary" to="/clubs/reapply">
            Re-apply an existing club
          </Link>
        </div>
      </header>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}

      {!error && !hasAny ? (
        <EmptyState title="No requests yet">
          Submitted club applications, re-applications, and event requests will
          appear here.
        </EmptyState>
      ) : null}

      {requests.length > 0 ? (
        <section className="stack">
          <h2>New club applications</h2>
          {requests.map((request) => {
            const canMutate =
              request.status === "DRAFT" ||
              request.status === "CHANGES_REQUESTED";
            const isBusy = busyId === request.id;

            return (
              <RequestCard
                key={request.id}
                request={request}
                createdClubSlug={clubSlugs[request.created_club_id]}
                createdClubMissing={
                  !request.created_club_id ||
                  Boolean(missingClubs[request.created_club_id])
                }
                actions={
                  canMutate ? (
                    <div className="button-row">
                      {request.status === "CHANGES_REQUESTED" ? (
                        <button
                          type="button"
                          className="button button--primary"
                          disabled={isBusy}
                          onClick={() =>
                            runAction(request.id, () =>
                              resubmitClubRequest(request.id),
                            )
                          }
                        >
                          {isBusy ? (
                            <Spinner size="sm" label="Working" />
                          ) : null}
                          Resubmit
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="button button--secondary"
                        disabled={isBusy}
                        onClick={() =>
                          runAction(request.id, () =>
                            withdrawClubRequest(request.id),
                          )
                        }
                      >
                        Withdraw
                      </button>
                      {request.status === "DRAFT" ? (
                        <button
                          type="button"
                          className="button button--danger"
                          disabled={isBusy}
                          onClick={() =>
                            runAction(request.id, () =>
                              deleteDraftClubRequest(request.id),
                            )
                          }
                        >
                          Delete draft
                        </button>
                      ) : null}
                    </div>
                  ) : null
                }
              />
            );
          })}
        </section>
      ) : null}

      {reapplications.length > 0 ? (
        <section className="stack">
          <h2>Club re-applications</h2>
          {reapplications.map((request) => (
            <article key={request.id} className="panel">
              <div className="section-heading">
                <div>
                  <span className="submission-type">Re-application</span>
                  <h3>{request.clubs?.name || "Past club"}</h3>
                  <StatusBadge status={request.status} />
                </div>
                {request.clubs?.slug && request.status === "APPROVED" ? (
                  <Link
                    className="text-link"
                    to={`/clubs/${request.clubs.slug}/manage`}
                  >
                    Manage club
                  </Link>
                ) : null}
              </div>
              <p className="muted">
                {request.school_year} · Submitted{" "}
                {formatDate(request.submitted_at)} · {request.applicant_email}
              </p>
              {request.review_notes ? (
                <p>
                  <strong>Review notes:</strong> {request.review_notes}
                </p>
              ) : null}
              {request.status === "CHANGES_REQUESTED" ? (
                <p>
                  <Link to={`/clubs/reapply?edit=${request.id}`}>
                    Edit and resubmit
                  </Link>
                </p>
              ) : null}
              {request.status === "REJECTED" ? (
                <p>
                  <Link to="/clubs/reapply">Create a new re-application</Link>{" "}
                  (subject to one application per Toronto calendar day).
                </p>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {eventRequests.length > 0 ? (
        <section className="stack">
          <h2>Event requests</h2>
          {eventRequests.map((request) => (
            <article key={request.id} className="panel">
              <div className="section-heading">
                <div>
                  <span className="submission-type">Event</span>
                  <h3>{request.event_name}</h3>
                  <StatusBadge status={request.status} />
                </div>
                {request.clubs?.slug ? (
                  <Link
                    className="text-link"
                    to={`/clubs/${request.clubs.slug}`}
                  >
                    {request.clubs.name}
                  </Link>
                ) : null}
              </div>
              <p className="muted">
                Submitted {formatDate(request.submitted_at)} ·{" "}
                {request.respondent_email}
              </p>
              {request.review_notes ? (
                <p>
                  <strong>Review notes:</strong> {request.review_notes}
                </p>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
