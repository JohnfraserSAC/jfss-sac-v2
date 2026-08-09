import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArchiveAnnouncementDialog } from "../components/announcements/ArchiveAnnouncementDialog";
import { AnnouncementStatusBadge } from "../components/announcements/AnnouncementStatusBadge";
import { AnnouncementTypeBadge } from "../components/announcements/AnnouncementTypeBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { getAnnouncementById } from "../services/announcements";
import {
  canArchiveAnnouncement,
  canEditAnnouncement,
} from "../utils/announcementPermissions";
import { formatDate } from "../utils/format";
import { formatDateOnly } from "../utils/torontoDate";
import { getErrorMessage } from "../utils/errors";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function AnnouncementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isSacAdmin,
    isFacultyAdvisor,
    ownedClubs,
  } = useAuth();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setAnnouncement(null);

      if (!UUID_PATTERN.test(id || "")) {
        setError("Invalid announcement link.");
        setLoading(false);
        return;
      }

      try {
        const data = await getAnnouncementById(id);
        if (!active) return;
        setAnnouncement(data);
      } catch (loadError) {
        if (!active) return;
        setError(
          getErrorMessage(
            loadError,
            "The announcement could not be found or you do not have permission to view it.",
          ),
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <LoadingScreen message="Loading announcement…" />;
  }

  if (error || !announcement) {
    return (
      <div className="page narrow-page">
        <EmptyState title="Announcement unavailable">
          {error ||
            "The announcement could not be found or you do not have permission to view it."}
        </EmptyState>
        <Link className="text-link" to="/announcements">
          Back to announcements
        </Link>
      </div>
    );
  }

  const club = announcement.clubs;
  const isCreator = user?.id && announcement.created_by === user.id;
  const showWorkflow =
    isAuthenticated &&
    (isCreator || isSacAdmin);
  const canEdit = canEditAnnouncement({
    announcement,
    userId: user?.id,
    isSacAdmin,
    isFacultyAdvisor,
    ownedClubs,
  });
  const canArchive = canArchiveAnnouncement({
    announcement,
    userId: user?.id,
    isSacAdmin,
    isFacultyAdvisor,
  });

  return (
    <div className="page narrow-page">
      {notice ? (
        <div className="alert alert--success" role="status">
          <strong>Success</strong>
          <p>{notice}</p>
        </div>
      ) : null}

      <article className="panel announcement-detail">
        <div className="badge-row">
          <AnnouncementTypeBadge club={club} />
          {showWorkflow ? (
            <AnnouncementStatusBadge status={announcement.status} />
          ) : null}
        </div>

        <h1>{announcement.title}</h1>

        {announcement.summary ? (
          <p className="lede">{announcement.summary}</p>
        ) : null}

        {announcement.image_url ? (
          <img
            src={announcement.image_url}
            alt=""
            className="announcement-detail__image"
          />
        ) : null}

        <div className="prose announcement-detail__body">
          {announcement.body}
        </div>

        <dl className="meta-list">
          <div>
            <dt>Posting date</dt>
            <dd>
              {formatDateOnly(announcement.scheduled_posting_date) || "—"}
            </dd>
          </div>
          <div>
            <dt>Published</dt>
            <dd>{formatDate(announcement.published_at) || "Not published"}</dd>
          </div>
          {announcement.archived_at ? (
            <div>
              <dt>Archived</dt>
              <dd>{formatDate(announcement.archived_at)}</dd>
            </div>
          ) : null}
          <div>
            <dt>Scope</dt>
            <dd>
              {club ? (
                club.slug ? (
                  <Link className="text-link" to={`/clubs/${club.slug}`}>
                    {club.name}
                  </Link>
                ) : (
                  club.name
                )
              ) : (
                "General announcement"
              )}
            </dd>
          </div>
          {showWorkflow ? (
            <>
              <div>
                <dt>Submitted</dt>
                <dd>{formatDate(announcement.submitted_at)}</dd>
              </div>
              <div>
                <dt>Reviewed</dt>
                <dd>{formatDate(announcement.reviewed_at)}</dd>
              </div>
            </>
          ) : null}
        </dl>

        {showWorkflow && announcement.review_notes ? (
          <div className="alert alert--warning" role="status">
            <strong>Review notes</strong>
            <p>{announcement.review_notes}</p>
          </div>
        ) : null}

        <div className="button-row">
          <Link className="button button--secondary" to="/announcements">
            All announcements
          </Link>
          {canEdit ? (
            <Link
              className="button button--primary"
              to={`/announcements/${announcement.id}/edit`}
            >
              Edit
            </Link>
          ) : null}
          {canArchive ? (
            <button
              type="button"
              className="button button--danger"
              onClick={() => setArchiveOpen(true)}
            >
              Archive
            </button>
          ) : null}
        </div>
      </article>

      <ArchiveAnnouncementDialog
        open={archiveOpen}
        announcement={announcement}
        onClose={() => setArchiveOpen(false)}
        onSuccess={() => {
          setNotice("Announcement archived.");
          navigate("/my-requests/announcements", {
            replace: true,
            state: { notice: "Announcement archived." },
          });
        }}
      />
    </div>
  );
}
