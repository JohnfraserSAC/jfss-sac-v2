import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { PermissionNotice } from "../components/PermissionNotice";
import { Select, TextArea, TextInput } from "../components/FormField";
import { StatusBadge } from "../components/StatusBadge";
import { Spinner } from "../components/Spinner";
import { createSignedClubDocumentUrl } from "../services/clubDocuments";
import {
  getAdminClubReapplicationQueue,
  reviewClubReapplication,
} from "../services/clubReapplications";
import { formatDate } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

export function AdminClubReapplicationsPage({ embedded = false }) {
  const { isSacAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [notesById, setNotesById] = useState({});
  const [previewUrls, setPreviewUrls] = useState({});

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminClubReapplicationQueue({ status, search });
      setRequests(data);
    } catch (loadError) {
      setError(
        getErrorMessage(loadError, "Could not load re-application queue."),
      );
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
        Club re-application review is limited to SAC administrators.
      </PermissionNotice>
    );
  }

  async function openSignedForm(request) {
    try {
      const url = await createSignedClubDocumentUrl(
        request.teacher_supervisor_form_storage_path,
      );
      setPreviewUrls((current) => ({ ...current, [request.id]: url }));
    } catch (previewError) {
      setError(getErrorMessage(previewError, "Could not open signed form."));
    }
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
      await reviewClubReapplication({
        requestId: request.id,
        action,
        reviewNotes: notes || null,
        confirmedClubId: request.club_id || null,
      });
      setSuccess(`Updated ${request.submitted_club_name} to ${action}.`);
      await loadQueue();
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Could not update the request."));
    } finally {
      setBusyId(null);
    }
  }

  if (loading && requests.length === 0) {
    return <LoadingScreen message="Loading re-applications…" />;
  }

  return (
    <div className={embedded ? "exec-section" : "page"}>
      {embedded ? (
        <h2 className="exec-section__title">Club Re-Applications</h2>
      ) : (
        <header className="page-header">
          <h1>Club re-applications</h1>
        </header>
      )}

      <div className="toolbar toolbar--split">
        <Select
          id="reapp-status"
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
          id="reapp-search"
          label="Search club name"
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
          No club re-applications match this filter.
        </EmptyState>
      ) : (
        <div className="stack">
          {requests.map((request) => {
            const isBusy = busyId === request.id;
            return (
              <article key={request.id} className="panel admin-request-card">
                <div className="section-heading">
                  <div>
                    <h2>{request.submitted_club_name}</h2>
                    <StatusBadge status={request.status} />
                  </div>
                </div>
                <dl className="meta-list">
                  <div>
                    <dt>Applicant email</dt>
                    <dd>{request.respondent_email}</dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>{formatDate(request.submitted_at)}</dd>
                  </div>
                  <div>
                    <dt>Linked club ID</dt>
                    <dd>
                      <code>{request.club_id || "Not linked"}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Seeking supervisor</dt>
                    <dd>
                      {request.is_seeking_teacher_supervisor ? "Yes" : "No"}
                    </dd>
                  </div>
                </dl>
                <div className="admin-request-card__details">
                  <p>
                    <strong>Purpose:</strong> {request.club_purpose}
                  </p>
                  <p>
                    <strong>Previous leaders:</strong>{" "}
                    {request.previous_year_leaders}
                  </p>
                  <p>
                    <strong>Current leaders:</strong>{" "}
                    {request.current_year_leaders}
                  </p>
                  <p>
                    <strong>Leader contact:</strong>{" "}
                    {request.new_leader_contact_information}
                  </p>
                  <p>
                    <strong>Club contact:</strong>{" "}
                    {request.club_contact_information}
                  </p>
                  <p>
                    <strong>Instagram:</strong> {request.instagram_handle}
                  </p>
                  <p>
                    <strong>Supervisor emails:</strong>{" "}
                    {(request.teacher_supervisor_emails || []).join(", ") ||
                      "None"}
                  </p>
                </div>

                <div className="button-row">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => openSignedForm(request)}
                  >
                    View signed form
                  </button>
                </div>
                {previewUrls[request.id] ? (
                  <img
                    src={previewUrls[request.id]}
                    alt="Signed teacher supervisor form"
                    className="signed-form-preview__image"
                  />
                ) : null}

                <TextArea
                  id={`reapp-notes-${request.id}`}
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
