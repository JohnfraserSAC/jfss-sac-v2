import { Link } from "react-router-dom";
import { AnnouncementStatusBadge } from "./AnnouncementStatusBadge";
import { announcementExcerpt } from "../../utils/announcementPermissions";
import { formatDate } from "../../utils/format";
import { formatDateOnly } from "../../utils/torontoDate";

function announcementDateLabel(announcement) {
  if (announcement.scheduled_posting_date) {
    return formatDateOnly(announcement.scheduled_posting_date);
  }
  return formatDate(
    announcement.published_at ||
      announcement.updated_at ||
      announcement.created_at,
  );
}

export function AnnouncementCard({
  announcement,
  showStatus = false,
  actions = null,
}) {
  const club = announcement.clubs;
  const excerpt = announcementExcerpt(announcement, 180);
  const dateLabel = announcementDateLabel(announcement);

  return (
    <article className="announcement-card">
      {announcement.image_url ? (
        <img
          src={announcement.image_url}
          alt=""
          className="announcement-card__image"
        />
      ) : (
        <div
          className="announcement-card__image announcement-card__image--fallback"
          aria-hidden="true"
        />
      )}

      <div className="announcement-card__body">
        <div className="announcement-card__header">
          <h2 className="announcement-card__title">
            <Link to={`/announcements/${announcement.id}`}>
              {announcement.title}
            </Link>
          </h2>
          <time className="announcement-card__date" dateTime={
            announcement.scheduled_posting_date ||
            announcement.published_at ||
            announcement.updated_at ||
            announcement.created_at ||
            undefined
          }>
            {dateLabel}
          </time>
        </div>

        {showStatus ? (
          <div className="badge-row">
            <AnnouncementStatusBadge status={announcement.status} />
          </div>
        ) : null}

        {excerpt ? (
          <p className="announcement-card__excerpt">{excerpt}</p>
        ) : null}

        <p className="announcement-card__club">
          {club?.slug ? (
            <Link className="text-link" to={`/clubs/${club.slug}`}>
              {club.name}
            </Link>
          ) : club?.name ? (
            club.name
          ) : (
            "John Fraser SAC"
          )}
        </p>

        {actions ? (
          <div className="button-row button-row--compact announcement-card__actions">
            {actions}
          </div>
        ) : null}
      </div>
    </article>
  );
}
