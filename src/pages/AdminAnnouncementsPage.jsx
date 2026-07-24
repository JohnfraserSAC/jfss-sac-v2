import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReviewAnnouncementDialog } from "../components/ArchiveAnnouncementDialog";
import { AnnouncementStatusBadge } from "../components/AnnouncementStatusBadge";
import { AnnouncementTypeBadge } from "../components/AnnouncementTypeBadge";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { PermissionNotice } from "../components/PermissionNotice";
import { Select, TextInput } from "../components/FormField";
import { Spinner } from "../components/Spinner";
import {
  getAnnouncementReviewQueue,
  reviewAnnouncement,
} from "../services/announcements";
import { formatDate } from "../utils/format";
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

  async function runQuickAction(announcement, action) {
    if (readOnly) return;
    setBusyId(announcement.id);
    setError("");
    setSuccess("");

    try {
      await reviewAnnouncement(announcement.id, action, null);
      setSuccess(`Updated “${announcement.title}” to ${action}.`);
      await loadQueue();
    } catch (actionError) {
      setError(
        getErrorMessage(actionError, "Could not update the announcement."),
      );
    } finally {
      setBusyId(null);
    }
  }

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
        `Updated “${reviewDialog.announcement.title}” to ${reviewDialog.action}.`,
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
              Review club-owner submissions. Creator profiles are not joined
              here because profiles RLS may only allow users to read their own
              row.
            </p>
          </div>
        </header>
      ) : (
        <h2 className="exec-section__title">Announcement Review</h2>
      )}

      {readOnly ? (
        <PermissionNotice title="Read only">
          You can view announcement submissions, but you cannot approve,
          reject, request changes, or publish.
        </PermissionNotice>
      ) : (
        <PermissionNotice title="Creator profile limitation">
          Moderation shows the created-by UUID. A safe creator-profile lookup
          RPC would be needed to display names and emails.
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

            return (
              <article key={announcement.id} className="panel admin-request-card">
                <div className="section-heading">
                  <div>
                    <h2>{announcement.title}</h2>
                    <div className="badge-row">
                      <AnnouncementStatusBadge status={announcement.status} />
                      <AnnouncementTypeBadge club={club} />
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
                    <dt>Submitted</dt>
                    <dd>{formatDate(announcement.submitted_at)}</dd>
                  </div>
                  <div>
                    <dt>Expires</dt>
                    <dd>{formatDate(announcement.expires_at)}</dd>
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
                      className="button button--secondary"
                      disabled={isBusy || announcement.status !== "SUBMITTED"}
                      onClick={() =>
                        runQuickAction(announcement, "UNDER_REVIEW")
                      }
                    >
                      {isBusy ? <Spinner size="sm" label="Working" /> : null}
                      Mark under review
                    </button>

                    <button
                      type="button"
                      className="button button--secondary"
                      disabled={
                        isBusy ||
                        !["SUBMITTED", "UNDER_REVIEW"].includes(
                          announcement.status,
                        )
                      }
                      onClick={() =>
                        setReviewDialog({
                          announcement,
                          action: "CHANGES_REQUESTED",
                          title: "Request changes",
                          confirmLabel: "Request changes",
                          requireNotes: true,
                        })
                      }
                    >
                      Request changes
                    </button>

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
                        )
                      }
                      onClick={() =>
                        setReviewDialog({
                          announcement,
                          action: "PUBLISH",
                          title: "Approve and publish",
                          confirmLabel: "Publish",
                          requireNotes: false,
                        })
                      }
                    >
                      Approve and publish
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
