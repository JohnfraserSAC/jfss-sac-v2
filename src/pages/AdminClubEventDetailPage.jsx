import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { StatusBadge } from "../components/ui/StatusBadge";
import { TextArea } from "../components/ui/TextArea";
import {
  getAdminClubEventRequestById,
  getClubEventPhotoUrl,
  reviewClubEventRequest,
} from "../services/clubEvents";
import { formatDate } from "../utils/format";
import { formatDateOnly } from "../utils/torontoDate";
import { getErrorMessage } from "../utils/errors";

const LIST_PATH = "/exec-dashboard/requests/events";

export function AdminClubEventDetailPage({ embedded = false }) {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { canMutateReviews, isSacAdmin, isSacExec, isFacultyAdvisor } =
    useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [busy, setBusy] = useState(false);

  const canView = isSacAdmin || isSacExec || isFacultyAdvisor;

  const loadRequest = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminClubEventRequestById(requestId);
      if (!data) {
        setRequest(null);
        setError("This event proposal could not be found.");
        return;
      }
      setRequest(data);
      setReviewNotes(data.review_notes || "");
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load this event proposal."));
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional async detail fetch
    if (canView) void loadRequest();
  }, [canView, loadRequest]);

  async function runAction() {
    if (!request || !confirmAction) return;
    const notes = reviewNotes.trim();
    if (confirmAction === "REJECTED" && !notes) {
      setActionError("Review notes are required when rejecting.");
      setConfirmAction(null);
      return;
    }

    setBusy(true);
    setActionError("");
    try {
      await reviewClubEventRequest({
        requestId: request.id,
        action: confirmAction,
        reviewNotes: notes || null,
      });
      navigate(LIST_PATH, {
        state: {
          success: `Updated ${request.event_name} to ${confirmAction}.`,
        },
      });
    } catch (actionErr) {
      setActionError(
        getErrorMessage(actionErr, "Could not update the event proposal."),
      );
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  }

  if (!canView) {
    return (
      <div className={embedded ? "exec-section" : "page"}>
        <ErrorMessage>Executive access is required.</ErrorMessage>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Loading event proposal…" />;
  }

  if (!request) {
    return (
      <div className={embedded ? "exec-section" : "page"}>
        <p>
          <Link className="text-link" to={LIST_PATH}>
            ← Back to event proposals
          </Link>
        </p>
        <ErrorMessage>{error || "Event proposal not found."}</ErrorMessage>
      </div>
    );
  }

  const clubName = request.clubs?.name || "Club event proposal";
  const photoUrl = getClubEventPhotoUrl(request.photo_storage_path);
  const canReview = canMutateReviews && request.status === "SUBMITTED";

  return (
    <div className={embedded ? "exec-section" : "page"}>
      <p className="exec-detail-back">
        <Link className="text-link" to={LIST_PATH}>
          ← Back to event proposals
        </Link>
      </p>

      <section className="admin-request-hero">
        <p className="admin-request-hero__eyebrow">Submitted</p>
        <div className="admin-request-hero__heading">
          <h2 className="exec-section__title">{request.event_name}</h2>
          <StatusBadge status={request.status} />
        </div>
        <div className="admin-request-hero__meta">
          <div>
            <span>Club</span>
            <strong>{clubName}</strong>
          </div>
          <span className="admin-request-hero__divider" aria-hidden="true" />
          <div>
            <span>Applicant</span>
            <strong>{request.applicant_email}</strong>
          </div>
          <span className="admin-request-hero__divider" aria-hidden="true" />
          <div>
            <span>Submitted</span>
            <strong>{formatDate(request.submitted_at)}</strong>
          </div>
        </div>
      </section>

      {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}

      <article className="panel admin-request-card">
        <dl className="detail-list">
          <div>
            <dt>Event dates</dt>
            <dd>
              {formatDateOnly(request.event_date)} –{" "}
              {formatDateOnly(request.event_end_date)}
            </dd>
          </div>
          <div className="detail-list__description">
            <dt>Detailed description</dt>
            <dd>{request.event_description}</dd>
          </div>
          <div className="detail-list__description">
            <dt>SAC/school materials</dt>
            <dd>{request.requested_materials}</dd>
          </div>
        </dl>

        {photoUrl ? (
          <section className="admin-request-subsection">
            <h3>Event photo</h3>
            <img
              className="event-review-photo"
              src={photoUrl}
              alt={`Photo for ${request.event_name}`}
            />
          </section>
        ) : null}

        {request.review_notes ? (
          <div className="alert alert--info">
            <strong>Review notes</strong>
            <p>{request.review_notes}</p>
          </div>
        ) : null}

        {canReview ? (
          <div className="admin-request-review">
            <TextArea
              id="event-review-notes"
              label="Review notes"
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              hint="Required when rejecting. Optional when approving."
              disabled={busy}
            />
            <div className="button-row">
              <button
                type="button"
                className="button button--primary"
                disabled={busy}
                onClick={() => setConfirmAction("APPROVED")}
              >
                Approve
              </button>
              <button
                type="button"
                className="button button--danger"
                disabled={busy}
                onClick={() => setConfirmAction("REJECTED")}
              >
                Reject
              </button>
            </div>
          </div>
        ) : null}
      </article>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={`${confirmAction || ""} event proposal?`}
        confirmLabel={confirmAction === "REJECTED" ? "Reject" : "Confirm"}
        destructive={confirmAction === "REJECTED"}
        busy={busy}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runAction}
      >
        <p>
          Confirm that you want to mark this proposal as{" "}
          <strong>{confirmAction}</strong>.
        </p>
      </ConfirmDialog>
    </div>
  );
}
