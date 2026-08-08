import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AttachmentPreview } from "../components/ui/AttachmentPreview";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { PermissionNotice } from "../components/ui/PermissionNotice";
import { TextArea } from "../components/ui/TextArea";
import { TextInput } from "../components/ui/TextInput";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Spinner } from "../components/ui/Spinner";
import {
  adminRejectPendingSupervisorClub,
  createSignedSupervisorDocumentUrl,
  defaultSupervisorDeadlineLocalValue,
  extendClubSupervisorDeadline,
  getAdminSupervisorRequestQueue,
  listSupervisorWatchClubs,
  localDateTimeValueToIso,
  reviewClubSupervisorRequest,
} from "../services/clubSupervisors";
import { formatDate, formatDeadlineRelative } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

function sortPendingClubs(rows) {
  return [...(rows || [])].sort((a, b) => {
    const aDue = a.supervisor_due_at
      ? new Date(a.supervisor_due_at).getTime()
      : Number.POSITIVE_INFINITY;
    const bDue = b.supervisor_due_at
      ? new Date(b.supervisor_due_at).getTime()
      : Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export function AdminSupervisorRequestsPage({ embedded = false }) {
  const { isSacAdmin, isSacExec } = useAuth();
  const canView = isSacAdmin || isSacExec;
  const canMutate = isSacAdmin;
  const [requests, setRequests] = useState([]);
  const [pendingClubs, setPendingClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [notesById, setNotesById] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [dueLocal, setDueLocal] = useState(defaultSupervisorDeadlineLocalValue());
  const [rejectNotes, setRejectNotes] = useState("");
  const [nowMs] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [queue, pending] = await Promise.all([
        getAdminSupervisorRequestQueue({ status: "ALL" }),
        listSupervisorWatchClubs("PENDING"),
      ]);
      setRequests(queue);
      setPendingClubs(sortPendingClubs(pending));
    } catch (loadError) {
      setError(
        getErrorMessage(loadError, "Could not load supervisor requests."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canView) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional async queue fetch
    load();
  }, [canView, load]);

  const sortedPending = useMemo(() => {
    const clubsWithOpenRequests = new Set(
      (requests || [])
        .filter((row) =>
          ["SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED"].includes(
            row.status,
          ),
        )
        .map((row) => row.club_id)
        .filter(Boolean),
    );

    return sortPendingClubs(pendingClubs).filter((row) => {
      if (clubsWithOpenRequests.has(row.club_id)) return false;
      // Also hide when the watch list reports an open package, even if the
      // request queue query lags or filters differently.
      return !["SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED"].includes(
        row.supervisor_request_status,
      );
    });
  }, [pendingClubs, requests]);

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
    if (action === "REJECTED" && !notes) {
      setError("Review notes are required when rejecting.");
      return;
    }
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

  async function confirmExtend() {
    if (!extendTarget) return;
    const iso = localDateTimeValueToIso(dueLocal);
    if (!iso) {
      setError("Choose a valid future deadline.");
      return;
    }
    setBusyId(extendTarget.club_id);
    setError("");
    setSuccess("");
    try {
      await extendClubSupervisorDeadline({
        clubId: extendTarget.club_id,
        newDueAt: iso,
      });
      setSuccess(`Deadline extended for ${extendTarget.name}.`);
      setExtendTarget(null);
      await load();
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Could not extend deadline."));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmRejectPending() {
    if (!rejectTarget) return;
    const notes = rejectNotes.trim();
    if (!notes) {
      setError("Review notes are required when rejecting.");
      return;
    }
    setBusyId(rejectTarget.club_id);
    setError("");
    setSuccess("");
    try {
      await adminRejectPendingSupervisorClub({
        clubId: rejectTarget.club_id,
        reviewNotes: notes,
      });
      setSuccess(
        `${rejectTarget.name} was rejected and returned to inactive / reapply-eligible.`,
      );
      setRejectTarget(null);
      setRejectNotes("");
      await load();
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Could not reject this club."));
    } finally {
      setBusyId(null);
    }
  }

  if (loading && requests.length === 0 && pendingClubs.length === 0) {
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

      <div className="supervisor-split">
        <header className="supervisor-split__intro supervisor-split__intro--requests">
          <h3 id="supervisor-requests-heading">Requests</h3>
          <p className="muted">
            Teacher supervisor packages submitted by club owners for SAC review.
          </p>
        </header>

        <header className="supervisor-split__intro supervisor-split__intro--pending">
          <h3 id="supervisor-pending-heading">Pending</h3>
          <p className="muted">
            Clubs with annual status Pending Supervisor. Sorted by deadline
            (most overdue first; missing deadlines last).
          </p>
        </header>

        <section
          className="stack supervisor-split__body supervisor-split__body--requests"
          aria-labelledby="supervisor-requests-heading"
        >
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
                        label="Review notes"
                        value={notesById[request.id] || ""}
                        onChange={(event) =>
                          setNotesById((current) => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))
                        }
                        hint="Required when rejecting. Optional when approving."
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
                          onClick={() => {
                            if (!(notesById[request.id] || "").trim()) {
                              setError(
                                "Review notes are required when rejecting.",
                              );
                              return;
                            }
                            setConfirmAction({
                              request,
                              action: "REJECTED",
                            });
                          }}
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
        </section>

        <section
          className="stack supervisor-split__body supervisor-split__body--pending"
          aria-labelledby="supervisor-pending-heading"
        >
          {sortedPending.length === 0 ? (
            <EmptyState
              title="No pending supervisor clubs"
              description="Clubs waiting on a teacher supervisor appear here."
            />
          ) : (
            <ul className="stack card-list">
              {sortedPending.map((row) => {
                const hasDeadline = Boolean(row.supervisor_due_at);
                const relative = formatDeadlineRelative(
                  row.supervisor_due_at,
                  nowMs,
                );
                return (
                  <li key={row.club_id} className="card">
                    <div className="card__header">
                      <h3>{row.name}</h3>
                      <StatusBadge status="PENDING_TEACHER_SUPERVISOR" />
                    </div>
                    <dl className="meta-list">
                      <div>
                        <dt>Owners</dt>
                        <dd>
                          {(row.owner_emails || []).length
                            ? row.owner_emails.join(", ")
                            : "None active"}
                        </dd>
                      </div>
                      <div>
                        <dt>Deadline</dt>
                        <dd>
                          {hasDeadline ? (
                            formatDate(row.supervisor_due_at)
                          ) : (
                            <span className="badge badge--danger">
                              Deadline missing
                            </span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Timing</dt>
                        <dd>
                          {hasDeadline ? (
                            <>
                              {relative}
                              {row.is_overdue ? (
                                <span className="badge badge--danger">
                                  {" "}
                                  Overdue
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span className="muted">No deadline on file</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Supervisor submission</dt>
                        <dd>
                          {row.supervisor_request_status ? (
                            <StatusBadge
                              status={row.supervisor_request_status}
                            />
                          ) : (
                            "None submitted"
                          )}
                        </dd>
                      </div>
                    </dl>
                    <p>
                      <Link to={`/clubs/${row.slug}`}>View club</Link>
                    </p>
                    {canMutate ? (
                      <div className="button-row">
                        <button
                          type="button"
                          className="button button--secondary"
                          disabled={busyId === row.club_id}
                          onClick={() => {
                            setDueLocal(
                              defaultSupervisorDeadlineLocalValue(
                                row.supervisor_due_at
                                  ? new Date(row.supervisor_due_at)
                                  : new Date(),
                              ),
                            );
                            setExtendTarget(row);
                          }}
                        >
                          Extend Deadline
                        </button>
                        <button
                          type="button"
                          className="button button--danger"
                          disabled={busyId === row.club_id}
                          onClick={() => {
                            setRejectNotes("");
                            setRejectTarget(row);
                          }}
                        >
                          Reject Club
                        </button>
                        {busyId === row.club_id ? <Spinner /> : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

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
            : `Reject the supervisor request for ${confirmAction?.request?.clubs?.name || "this club"}? Review notes are required.`}
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(extendTarget)}
        title="Extend supervisor deadline"
        confirmLabel="Extend deadline"
        busy={busyId === extendTarget?.club_id}
        onCancel={() => setExtendTarget(null)}
        onConfirm={confirmExtend}
      >
        <p>
          Extend the teacher supervisor deadline for{" "}
          <strong>{extendTarget?.name}</strong>.
        </p>
        <TextInput
          id="extend-due-at"
          label="New deadline"
          type="datetime-local"
          value={dueLocal}
          onChange={(event) => setDueLocal(event.target.value)}
          required
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        title="Reject pending club?"
        confirmLabel="Reject club"
        destructive
        busy={busyId === rejectTarget?.club_id}
        confirmDisabled={!rejectNotes.trim()}
        onCancel={() => setRejectTarget(null)}
        onConfirm={confirmRejectPending}
      >
        <p>
          This returns <strong>{rejectTarget?.name}</strong> to inactive status,
          rejects the approved re-application, and clears active memberships.
          History is preserved and the club stays available for future
          re-application.
        </p>
        <TextArea
          id="reject-notes"
          label="Review notes"
          value={rejectNotes}
          onChange={(event) => setRejectNotes(event.target.value)}
          required
          hint="Required when rejecting."
        />
      </ConfirmDialog>
    </div>
  );
}
