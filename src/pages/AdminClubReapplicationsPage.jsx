import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AttachmentPreview } from "../components/AttachmentPreview";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { PermissionNotice } from "../components/PermissionNotice";
import { Select, TextArea, TextInput } from "../components/FormField";
import { StatusBadge } from "../components/StatusBadge";
import { Spinner } from "../components/Spinner";
import { createSignedClubDocumentUrl } from "../services/clubDocuments";
import {
  approveClubReapplication,
  getAdminClubReapplicationQueue,
  reviewClubReapplication,
} from "../services/clubReapplications";
import {
  defaultSupervisorDeadlineLocalValue,
  localDateTimeValueToIso,
} from "../services/clubSupervisors";
import { formatDate } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

export function AdminClubReapplicationsPage({ embedded = false }) {
  const { isSacAdmin, isSacExec } = useAuth();
  const canView = isSacAdmin || isSacExec;
  const canMutate = isSacAdmin;

  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [notesById, setNotesById] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const [hasSupervisor, setHasSupervisor] = useState("YES");
  const [supervisorDueLocal, setSupervisorDueLocal] = useState(
    defaultSupervisorDeadlineLocalValue(),
  );

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
    if (!canView) return;
    const handle = window.setTimeout(loadQueue, 250);
    return () => window.clearTimeout(handle);
  }, [loadQueue, canView]);

  if (!canView) {
    return (
      <PermissionNotice title="Exec access required">
        Club re-application review is limited to SAC administrators and
        executives.
      </PermissionNotice>
    );
  }

  function openApproveConfirm(request) {
    const listed =
      (request.club_reapplication_supervisors || []).length > 0 &&
      !request.is_seeking_teacher_supervisor;
    setHasSupervisor(listed ? "YES" : "NO");
    setSupervisorDueLocal(defaultSupervisorDeadlineLocalValue());
    setConfirmAction({ request, action: "APPROVED" });
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
      if (action === "APPROVED") {
        const withSupervisor = hasSupervisor === "YES";
        const dueIso = withSupervisor
          ? null
          : localDateTimeValueToIso(supervisorDueLocal);
        if (!withSupervisor && !dueIso) {
          setError("Choose a valid supervisor deadline.");
          setBusyId(null);
          return;
        }
        await approveClubReapplication({
          requestId: request.id,
          reviewNotes: notes || null,
          hasTeacherSupervisor: withSupervisor,
          supervisorDueAt: dueIso,
        });
      } else {
        await reviewClubReapplication({
          requestId: request.id,
          action,
          reviewNotes: notes || null,
        });
      }
      const clubName = request.clubs?.name || "Club";
      if (action === "APPROVED") {
        setSuccess(
          hasSupervisor === "YES"
            ? `${clubName} was approved and is now public on Explore.`
            : `${clubName} was approved as Pending Teacher Supervisor.`,
        );
      } else {
        setSuccess(`Updated ${clubName} to ${action}.`);
      }
      setConfirmAction(null);
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
      {!embedded ? (
        <header className="page-header">
          <h1>Re-Application Review</h1>
        </header>
      ) : (
        <div className="section-heading-row">
          <h2>Pending Reapplications</h2>
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

      <div className="toolbar grid-2">
        <Select
          id="reapp-status"
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
          <option value="WITHDRAWN">Withdrawn</option>
        </Select>
        <TextInput
          id="reapp-search"
          label="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="No re-applications"
          description="Nothing matches this filter."
        />
      ) : (
        <ul className="stack card-list">
          {requests.map((request) => {
            const clubName = request.clubs?.name || "Unknown club";
            return (
              <li key={request.id} className="card">
                <div className="card__header">
                  <h3>{clubName}</h3>
                  <StatusBadge status={request.status} />
                </div>
                <dl className="detail-list">
                  <div>
                    <dt>Applicant</dt>
                    <dd>{request.applicant_email}</dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>{formatDate(request.submitted_at)}</dd>
                  </div>
                  <div>
                    <dt>School year</dt>
                    <dd>{request.school_year}</dd>
                  </div>
                  <div>
                    <dt>Short description</dt>
                    <dd>{request.short_description}</dd>
                  </div>
                  <div>
                    <dt>Full description</dt>
                    <dd>{request.description}</dd>
                  </div>
                  <div>
                    <dt>Public email</dt>
                    <dd>{request.public_email}</dd>
                  </div>
                  <div>
                    <dt>Instagram</dt>
                    <dd>{request.instagram_handle || "—"}</dd>
                  </div>
                  <div>
                    <dt>Meeting</dt>
                    <dd>
                      {request.meeting_frequency}
                      {request.meeting_days?.length
                        ? ` · ${request.meeting_days.join(", ")}`
                        : ""}
                      {request.meeting_time_details
                        ? ` · ${request.meeting_time_details}`
                        : ""}
                      {request.meeting_location
                        ? ` · ${request.meeting_location}`
                        : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>Seeking supervisor</dt>
                    <dd>
                      {request.is_seeking_teacher_supervisor ? "Yes" : "No"}
                    </dd>
                  </div>
                  <div>
                    <dt>Supervisors</dt>
                    <dd>
                      {(request.club_reapplication_supervisors || []).length ===
                      0
                        ? "None"
                        : request.club_reapplication_supervisors
                            .map(
                              (s) =>
                                `${s.supervisor_name} <${s.supervisor_email}>`,
                            )
                            .join("; ")}
                    </dd>
                  </div>
                  {request.review_notes ? (
                    <div>
                      <dt>Review notes</dt>
                      <dd>{request.review_notes}</dd>
                    </div>
                  ) : null}
                </dl>

                {(request.club_reapplication_attachments || []).map((att) => (
                  <AttachmentPreview
                    key={att.id}
                    path={att.storage_path}
                    getSignedUrl={createSignedClubDocumentUrl}
                    mimeType={att.mime_type}
                    filename={att.original_filename}
                    alt={
                      att.original_filename ||
                      "Re-application attachment"
                    }
                  />
                ))}

                {canMutate &&
                ["SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED"].includes(
                  request.status,
                ) ? (
                  <>
                    <TextArea
                      id={`notes-${request.id}`}
                      label="Review notes"
                      value={notesById[request.id] || ""}
                      onChange={(event) =>
                        setNotesById((current) => ({
                          ...current,
                          [request.id]: event.target.value,
                        }))
                      }
                    />
                    <div className="button-row">
                      <button
                        type="button"
                        className="button"
                        disabled={busyId === request.id}
                        onClick={() => openApproveConfirm(request)}
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
            );
          })}
        </ul>
      )}

      {confirmAction ? (
        <ConfirmDialog
          open
          title={
            confirmAction.action === "APPROVED"
              ? "Approve re-application?"
              : "Reject re-application?"
          }
          confirmLabel={
            confirmAction.action === "APPROVED" ? "Approve" : "Reject"
          }
          destructive={confirmAction.action === "REJECTED"}
          busy={busyId === confirmAction.request.id}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() =>
            runAction(
              confirmAction.request,
              confirmAction.action,
              confirmAction.action === "REJECTED",
            )
          }
        >
          {confirmAction.action === "APPROVED" ? (
            <>
              <p>
                Approving replaces the club profile, clears prior memberships,
                and assigns the applicant as OWNER.
              </p>
              <Select
                id="has-teacher-supervisor"
                label="Does this club currently have a teacher supervisor?"
                value={hasSupervisor}
                onChange={(event) => setHasSupervisor(event.target.value)}
              >
                <option value="YES">YES — approve as ACTIVE / public</option>
                <option value="NO">
                  NO — approve as Pending Teacher Supervisor
                </option>
              </Select>
              {hasSupervisor === "NO" ? (
                <TextInput
                  id="supervisor-due-at"
                  label="Supervisor deadline (defaults to 7 days)"
                  type="datetime-local"
                  value={supervisorDueLocal}
                  onChange={(event) =>
                    setSupervisorDueLocal(event.target.value)
                  }
                  required
                />
              ) : null}
            </>
          ) : (
            <p>
              This will reject the request. The club can be re-selected later
              subject to the daily quota.
            </p>
          )}
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
