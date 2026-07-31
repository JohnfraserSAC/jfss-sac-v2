import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { PermissionNotice } from "../components/PermissionNotice";
import { TextArea, TextInput } from "../components/FormField";
import { StatusBadge } from "../components/StatusBadge";
import { Spinner } from "../components/Spinner";
import {
  adminRejectPendingSupervisorClub,
  defaultSupervisorDeadlineLocalValue,
  extendClubSupervisorDeadline,
  listSupervisorWatchClubs,
  localDateTimeValueToIso,
} from "../services/clubSupervisors";
import { formatDate } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

export function AdminSupervisorWatchPage({
  embedded = false,
  mode = "PENDING",
}) {
  const { isSacAdmin, isSacExec } = useAuth();
  const canView = isSacAdmin || isSacExec;
  const canMutate = isSacAdmin;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [dueLocal, setDueLocal] = useState(defaultSupervisorDeadlineLocalValue());
  const [rejectNotes, setRejectNotes] = useState("");

  const title =
    mode === "OVERDUE" ? "Overdue Supervisor" : "Pending Supervisor";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listSupervisorWatchClubs(mode);
      setRows(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load clubs."));
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    if (!canView) return;
    load();
  }, [canView, load]);

  if (!canView) {
    return (
      <PermissionNotice title="Exec access required">
        Supervisor watch lists are limited to SAC administrators and executives.
      </PermissionNotice>
    );
  }

  if (loading && rows.length === 0) {
    return <LoadingScreen message="Loading clubs…" />;
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

  async function confirmReject() {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.club_id);
    setError("");
    setSuccess("");
    try {
      await adminRejectPendingSupervisorClub({
        clubId: rejectTarget.club_id,
        reviewNotes: rejectNotes.trim() || null,
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

  return (
    <div className={embedded ? "exec-section" : "page"}>
      {!embedded ? (
        <header className="page-header">
          <h1>{title}</h1>
        </header>
      ) : (
        <h2>{title}</h2>
      )}

      {!canMutate ? (
        <p className="muted">SAC Exec access is read-only.</p>
      ) : null}

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {success ? (
        <div className="alert alert--success" role="status">
          {success}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No clubs in this category"
          description="Nothing matches the current supervisor watch filter."
        />
      ) : (
        <ul className="stack card-list">
          {rows.map((row) => (
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
                  <dt>Approval date</dt>
                  <dd>
                    {row.approved_at ? formatDate(row.approved_at) : "Unknown"}
                  </dd>
                </div>
                <div>
                  <dt>Deadline</dt>
                  <dd>
                    {row.supervisor_due_at
                      ? formatDate(row.supervisor_due_at)
                      : "Not set"}
                    {row.is_overdue ? (
                      <span className="badge badge--danger">
                        {" "}
                        {row.days_overdue} day
                        {row.days_overdue === 1 ? "" : "s"} overdue
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt>Supervisor submission</dt>
                  <dd>
                    {row.supervisor_request_status ? (
                      <StatusBadge status={row.supervisor_request_status} />
                    ) : (
                      "None submitted"
                    )}
                  </dd>
                </div>
              </dl>
              <p>
                <Link to={`/clubs/${row.slug}/manage`}>Manage</Link>
                {" · "}
                <Link to="/exec-dashboard/supervisor-requests">
                  Supervisor request queue
                </Link>
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
          ))}
        </ul>
      )}

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
        onCancel={() => setRejectTarget(null)}
        onConfirm={confirmReject}
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
        />
      </ConfirmDialog>
    </div>
  );
}
