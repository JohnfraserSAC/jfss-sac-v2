import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AttachmentPreview } from "../components/AttachmentPreview";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { PermissionNotice } from "../components/PermissionNotice";
import { Select, TextArea } from "../components/FormField";
import { StatusBadge } from "../components/StatusBadge";
import { Spinner } from "../components/Spinner";
import {
  createSignedSupervisorDocumentUrl,
  getAdminSupervisorRequestQueue,
  reviewClubSupervisorRequest,
} from "../services/clubSupervisors";
import { formatDate } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

export function AdminSupervisorRequestsPage({ embedded = false }) {
  const { isSacAdmin, isSacExec } = useAuth();
  const canView = isSacAdmin || isSacExec;
  const canMutate = isSacAdmin;
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [notesById, setNotesById] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminSupervisorRequestQueue({ status });
      setRequests(data);
    } catch (loadError) {
      setError(
        getErrorMessage(loadError, "Could not load supervisor requests."),
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (!canView) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional async queue fetch
    load();
  }, [canView, load]);

  if (!canView) {
    return (
      <PermissionNotice title="Exec access required">
        Supervisor request review is limited to SAC administrators and
        executives.
      </PermissionNotice>
    );
  }

  async function runAction(request, action) {
    const notes = (notesById[request.id] || "").trim();
    setBusyId(request.id);
    setError("");
    setSuccess("");
    try {
      await reviewClubSupervisorRequest({
        requestId: request.id,
        action,
        reviewNotes: notes || null,
      });
      setSuccess(
        action === "APPROVED"
          ? `${request.clubs?.name || "Club"} supervisor approved. Club is now ACTIVE if at least one advisor is active.`
          : `Updated request to ${action}.`,
      );
      setConfirmAction(null);
      await load();
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Could not update request."));
    } finally {
      setBusyId(null);
    }
  }

  if (loading && requests.length === 0) {
    return <LoadingScreen message="Loading supervisor requests…" />;
  }

  return (
    <div className={embedded ? "exec-section" : "page"}>
      {!embedded ? (
        <header className="page-header">
          <h1>Supervisor Requests</h1>
        </header>
      ) : (
        <div className="section-heading-row">
          <h2>Supervisor Requests</h2>
          {!canMutate ? (
            <span className="badge badge--role badge--role-sac-exec">
              Read only
            </span>
          ) : null}
        </div>
      )}

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {success ? (
        <div className="alert alert--success" role="status">
          {success}
        </div>
      ) : null}

      <div className="toolbar">
        <Select
          id="sup-req-status"
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="ALL">Open queue</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="CHANGES_REQUESTED">Changes requested</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="No supervisor requests"
          description="Owner-submitted teacher supervisor packages appear here."
        />
      ) : (
        <ul className="stack card-list">
          {requests.map((request) => (
            <li key={request.id} className="card">
              <div className="card__header">
                <h3>{request.clubs?.name || "Club"}</h3>
                <StatusBadge status={request.status} />
              </div>
              <dl className="detail-list">
                <div>
                  <dt>Requesting owner</dt>
                  <dd>
                    {request.submitter?.full_name ||
                      request.submitter?.email ||
                      "Unknown owner"}
                  </dd>
                </div>
                <div>
                  <dt>Submitted</dt>
                  <dd>{formatDate(request.submitted_at)}</dd>
                </div>
                {(request.club_supervisor_request_supervisors || []).map(
                  (supervisor) => (
                    <div key={supervisor.id || supervisor.supervisor_email}>
                      <dt>Teacher</dt>
                      <dd>
                        {supervisor.supervisor_name}
                        <br />
                        <span className="muted">
                          {supervisor.supervisor_email}
                        </span>
                      </dd>
                    </div>
                  ),
                )}
                {request.review_notes ? (
                  <div>
                    <dt>Review notes</dt>
                    <dd>{request.review_notes}</dd>
                  </div>
                ) : null}
              </dl>
              {(request.club_supervisor_request_attachments || []).map(
                (att) => (
                  <AttachmentPreview
                    key={att.id}
                    path={att.storage_path}
                    getSignedUrl={createSignedSupervisorDocumentUrl}
                    mimeType={att.mime_type}
                    filename={att.original_filename}
                    alt={
                      att.original_filename ||
                      "Teacher supervisor signature attachment"
                    }
                  />
                ),
              )}
              {canMutate &&
              ["SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED"].includes(
                request.status,
              ) ? (
                <>
                  <TextArea
                    id={`sup-notes-${request.id}`}
                    label="Review notes (optional for reject)"
                    value={notesById[request.id] || ""}
                    onChange={(event) =>
                      setNotesById((current) => ({
                        ...current,
                        [request.id]: event.target.value,
                      }))
                    }
                    hint="Optional when rejecting. A default note is stored if left blank."
                  />
                  <div className="button-row">
                    <button
                      type="button"
                      className="button"
                      disabled={busyId === request.id}
                      onClick={() =>
                        setConfirmAction({ request, action: "APPROVED" })
                      }
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="button button--danger"
                      disabled={busyId === request.id}
                      onClick={() =>
                        setConfirmAction({ request, action: "REJECTED" })
                      }
                    >
                      Reject
                    </button>
                    {busyId === request.id ? <Spinner /> : null}
                  </div>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={
          confirmAction?.action === "APPROVED"
            ? "Approve supervisor request?"
            : "Reject supervisor request?"
        }
        confirmLabel={
          confirmAction?.action === "APPROVED" ? "Approve" : "Reject"
        }
        destructive={confirmAction?.action === "REJECTED"}
        busy={busyId === confirmAction?.request?.id}
        onCancel={() => {
          if (busyId) return;
          setConfirmAction(null);
        }}
        onConfirm={() => {
          if (!confirmAction) return;
          void runAction(confirmAction.request, confirmAction.action);
        }}
      >
        <p>
          {confirmAction?.action === "APPROVED"
            ? `Approve the teacher supervisor for ${confirmAction.request.clubs?.name || "this club"}?`
            : `Reject the supervisor request for ${confirmAction?.request?.clubs?.name || "this club"}?`}
        </p>
      </ConfirmDialog>
    </div>
  );
}
