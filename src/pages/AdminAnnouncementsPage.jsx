import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReviewAnnouncementDialog } from "../components/announcements/ReviewAnnouncementDialog";
import { AnnouncementStatusBadge } from "../components/announcements/AnnouncementStatusBadge";
import { AnnouncementTypeBadge } from "../components/announcements/AnnouncementTypeBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { PermissionNotice } from "../components/ui/PermissionNotice";
import { Select } from "../components/ui/Select";
import { TextInput } from "../components/ui/TextInput";
import {
  getAnnouncementReviewQueue,
  reviewAnnouncement,
} from "../services/announcements";
import { formatDate } from "../utils/format";
import { formatDateOnly, getPostingUrgency, getTorontoTodayYmd } from "../utils/torontoDate";
import { getErrorMessage } from "../utils/errors";

export function AdminAnnouncementsPage({ embedded = false }) {
  const { canMutateReviews } = useAuth();
  const readOnly = !canMutateReviews;
  const [announcements, setAnnouncements] = useState([]);
  const [status, setStatus] = useState("ACTIVE");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAnnouncementReviewQueue({ status, search });
      setAnnouncements(data);
    } catch (loadError) {
      setError(
        getErrorMessage(loadError, "Could not load the announcement queue."),
      );
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      loadQueue();
    }, 250);
    return () => window.clearTimeout(handle);
  }, [loadQueue]);

  async function confirmReview(notes) {
    if (!reviewDialog || readOnly) return;
    setBusyId(reviewDialog.announcement.id);
    setError("");
    setSuccess("");

    try {
      await reviewAnnouncement(
        reviewDialog.announcement.id,
        reviewDialog.action,
        notes,
      );
      setSuccess(
        reviewDialog.action === "PUBLISH"
          ? reviewDialog.announcement.scheduled_posting_date ===
            getTorontoTodayYmd()
            ? `Approved “${reviewDialog.announcement.title}”. It is live on the public board now.`
            : `Approved “${reviewDialog.announcement.title}”. It will appear on the public board on its Toronto posting date.`
          : `Updated “${reviewDialog.announcement.title}” to ${reviewDialog.action}.`,
      );
      setReviewDialog(null);
      await loadQueue();
    } catch (actionError) {
      throw actionError;
    } finally {
      setBusyId(null);
    }
  }

  if (loading && announcements.length === 0) {
    return <LoadingScreen message="Loading announcement queue…" />;
  }

  return (
    <div className={embedded ? "exec-section" : "page"}>
      {!embedded ? (
        <header className="page-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Announcement review queue</h1>
            <p className="lede">
              Review submissions sorted by scheduled Toronto posting date.
              Approving a same-day request publishes it immediately; future
              dates go live at midnight America/Toronto on that day.
            </p>
          </div>
        </header>
      ) : (
        <h2 className="exec-section__title">Announcement Review</h2>
      )}

      {readOnly ? (
        <PermissionNotice title="Read only">
          You can view announcement submissions, but you cannot approve or
          reject them.
        </PermissionNotice>
      ) : (
        <PermissionNotice title="Scheduled posting">
          Choose today to publish when approved, or a future Toronto date to
          schedule midnight go-live. Unapproved requests are cancelled after
          their posting day ends.
        </PermissionNotice>
      )}

      <div className="toolbar toolbar--split">
        <Select
          id="announcement-queue-status"
          label="Filter by status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="ACTIVE">Submitted + under review</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="CHANGES_REQUESTED">Changes requested</option>
          <option value="ALL">All queue statuses</option>
        </Select>
        <TextInput
          id="announcement-queue-search"
          label="Search by title"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search title"
        />
      </div>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {success ? (
        <div className="alert alert--success" role="status">
          <strong>Success</strong>
          <p>{success}</p>
        </div>
      ) : null}

      {!error && announcements.length === 0 ? (
        <EmptyState title="Queue is empty">
          There are no announcements matching this filter.
        </EmptyState>
      ) : (
        <div className="stack">
          {announcements.map((announcement) => {
            const club = announcement.clubs;
            const isBusy = busyId === announcement.id;
            const urgency = getPostingUrgency(
              announcement.scheduled_posting_date,
            );

            return (
              <article key={announcement.id} className="panel admin-request-card">
                <div className="section-heading">
                  <div>
                    <h2>{announcement.title}</h2>
                    <div className="badge-row">
                      <AnnouncementStatusBadge status={announcement.status} />
                      <AnnouncementTypeBadge club={club} />
                      {announcement.scheduled_posting_date ? (
                        <span
                          className={`urgency-text urgency-text--${urgency.tone}`}
                        >
                          {urgency.label}
                        </span>
                      ) : (
                        <span className="urgency-text urgency-text--danger">
                          Posting date required
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    className="text-link"
                    to={`/announcements/${announcement.id}`}
                  >
                    Open detail
                  </Link>
                </div>

                {announcement.summary ? <p>{announcement.summary}</p> : null}

                {announcement.image_url ? (
                  <img
                    src={announcement.image_url}
                    alt=""
                    className="announcement-detail__image"
                  />
                ) : null}

                <div className="prose">{announcement.body}</div>

                <dl className="meta-list">
                  <div>
                    <dt>Created by</dt>
                    <dd>
                      <code>{announcement.created_by}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Club</dt>
                    <dd>{club?.name || "General"}</dd>
                  </div>
                  <div>
                    <dt>Posting date</dt>
                    <dd>
                      {formatDateOnly(announcement.scheduled_posting_date)}
                    </dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>{formatDate(announcement.submitted_at)}</dd>
                  </div>
                </dl>

                {announcement.review_notes ? (
                  <div className="alert alert--warning" role="status">
                    <strong>Current review notes</strong>
                    <p>{announcement.review_notes}</p>
                  </div>
                ) : null}

                {!readOnly ? (
                  <div className="button-row">
                    <button
                      type="button"
                      className="button button--danger"
                      disabled={
                        isBusy ||
                        !["SUBMITTED", "UNDER_REVIEW"].includes(
                          announcement.status,
                        )
                      }
                      onClick={() =>
                        setReviewDialog({
                          announcement,
                          action: "REJECTED",
                          title: "Reject announcement",
                          confirmLabel: "Reject",
                          requireNotes: true,
                        })
                      }
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      className="button button--primary"
                      disabled={
                        isBusy ||
                        !["SUBMITTED", "UNDER_REVIEW"].includes(
                          announcement.status,
                        ) ||
                        !announcement.scheduled_posting_date
                      }
                      onClick={() =>
                        setReviewDialog({
                          announcement,
                          action: "PUBLISH",
                          title: "Approve announcement",
                          confirmLabel: "Approve",
                          requireNotes: false,
                        })
                      }
                    >
                      Approve
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <ReviewAnnouncementDialog
        open={Boolean(reviewDialog)}
        title={reviewDialog?.title || ""}
        confirmLabel={reviewDialog?.confirmLabel || "Confirm"}
        requireNotes={Boolean(reviewDialog?.requireNotes)}
        onCancel={() => setReviewDialog(null)}
        onConfirm={confirmReview}
        busy={Boolean(reviewDialog && busyId === reviewDialog.announcement.id)}
      />
    </div>
  );
}
