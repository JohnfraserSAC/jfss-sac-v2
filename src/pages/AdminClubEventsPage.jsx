import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { PermissionNotice } from "../components/PermissionNotice";
import { Select, TextArea, TextInput } from "../components/FormField";
import { StatusBadge } from "../components/StatusBadge";
import { Spinner } from "../components/Spinner";
import {
  getAdminClubEventQueue,
  reviewClubEventRequest,
} from "../services/clubEventRequests";
import { formatDate } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

export function AdminClubEventsPage({ embedded = false }) {
  const { isSacAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [notesById, setNotesById] = useState({});

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminClubEventQueue({ status, search });
      setRequests(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load event queue."));
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    if (!isSacAdmin) return;
    const handle = window.setTimeout(loadQueue, 250);
    return () => window.clearTimeout(handle);
  }, [loadQueue, isSacAdmin]);

  if (!isSacAdmin) {
    return (
      <PermissionNotice title="SAC Admin only">
        Event approval review is limited to SAC administrators.
      </PermissionNotice>
    );
  }

  async function runAction(request, action, requireNotes) {
    const notes = (notesById[request.id] || "").trim();
    if (requireNotes && !notes) {
      setError("Review notes are required for this action.");
      return;
    }
    setBusyId(request.id);
    setError("");
    setSuccess("");
    try {
      await reviewClubEventRequest({
        requestId: request.id,
        action,
        reviewNotes: notes || null,
      });
      setSuccess(`Updated “${request.event_name}” to ${action}.`);
      await loadQueue();
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Could not update the request."));
    } finally {
      setBusyId(null);
    }
  }

  if (loading && requests.length === 0) {
    return <LoadingScreen message="Loading event requests…" />;
  }

  return (
    <div className={embedded ? "exec-section" : "page"}>
      {embedded ? (
        <h2 className="exec-section__title">Event Approvals</h2>
      ) : (
        <header className="page-header">
          <h1>Event approvals</h1>
        </header>
      )}

      <div className="toolbar toolbar--split">
        <Select
          id="event-status"
          label="Filter by status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="ALL">Pending queue</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="CHANGES_REQUESTED">Changes requested</option>
        </Select>
        <TextInput
          id="event-search"
          label="Search event name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {success ? (
        <div className="alert alert--success" role="status">
          <strong>Success</strong>
          <p>{success}</p>
        </div>
      ) : null}

      {!error && requests.length === 0 ? (
        <EmptyState title="Queue is empty">
          No event requests match this filter.
        </EmptyState>
      ) : (
        <div className="stack">
          {requests.map((request) => {
            const club = request.clubs;
            const isBusy = busyId === request.id;
            return (
              <article key={request.id} className="panel admin-request-card">
                <div className="section-heading">
                  <div>
                    <h2>{request.event_name}</h2>
                    <StatusBadge status={request.status} />
                  </div>
                  {club?.slug ? (
                    <Link className="text-link" to={`/clubs/${club.slug}`}>
                      View club
                    </Link>
                  ) : null}
                </div>
                <dl className="meta-list">
                  <div>
                    <dt>Club</dt>
                    <dd>{club?.name || request.club_id}</dd>
                  </div>
                  <div>
                    <dt>Club email</dt>
                    <dd>{request.club_email}</dd>
                  </div>
                  <div>
                    <dt>Applicant</dt>
                    <dd>{request.respondent_email}</dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>{formatDate(request.submitted_at)}</dd>
                  </div>
                </dl>
                <p>
                  <strong>Details:</strong> {request.event_details}
                </p>
                <p>
                  <strong>Materials:</strong> {request.requested_materials}
                </p>

                <TextArea
                  id={`event-notes-${request.id}`}
                  label="Review notes"
                  value={notesById[request.id] || ""}
                  onChange={(event) =>
                    setNotesById((current) => ({
                      ...current,
                      [request.id]: event.target.value,
                    }))
                  }
                  rows={3}
                />

                <div className="button-row">
                  <button
                    type="button"
                    className="button button--secondary"
                    disabled={isBusy || request.status === "UNDER_REVIEW"}
                    onClick={() => runAction(request, "UNDER_REVIEW", false)}
                  >
                    {isBusy ? <Spinner size="sm" label="Working" /> : null}
                    Mark under review
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    disabled={isBusy}
                    onClick={() =>
                      runAction(request, "CHANGES_REQUESTED", true)
                    }
                  >
                    Request changes
                  </button>
                  <button
                    type="button"
                    className="button button--danger"
                    disabled={isBusy}
                    onClick={() => runAction(request, "REJECTED", true)}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="button button--primary"
                    disabled={isBusy}
                    onClick={() => runAction(request, "APPROVED", false)}
                  >
                    Approve
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
