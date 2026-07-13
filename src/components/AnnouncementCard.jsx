import { Link } from "react-router-dom";
import { AnnouncementStatusBadge } from "./AnnouncementStatusBadge";
import { AnnouncementTypeBadge } from "./AnnouncementTypeBadge";
import { announcementExcerpt } from "../utils/announcementPermissions";
import { formatDate } from "../utils/format";

export function AnnouncementCard({
  announcement,
  showStatus = false,
  actions = null,
}) {
  const club = announcement.clubs;
  const excerpt = announcementExcerpt(announcement);

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
        <div className="badge-row">
          <AnnouncementTypeBadge club={club} />
          {showStatus ? (
            <AnnouncementStatusBadge status={announcement.status} />
          ) : null}
        </div>

        <h2>
          <Link to={`/announcements/${announcement.id}`}>
            {announcement.title}
          </Link>
        </h2>

        {excerpt ? <p>{excerpt}</p> : null}

        <dl className="meta-list">
          {club ? (
            <div>
              <dt>Club</dt>
              <dd>
                {club.slug ? (
                  <Link className="text-link" to={`/clubs/${club.slug}`}>
                    {club.name}
                  </Link>
                ) : (
                  club.name
                )}
              </dd>
            </div>
          ) : (
            <div>
              <dt>Scope</dt>
              <dd>General</dd>
            </div>
          )}
          <div>
            <dt>
              {announcement.published_at ? "Published" : "Updated"}
            </dt>
            <dd>
              {formatDate(
                announcement.published_at ||
                  announcement.updated_at ||
                  announcement.created_at,
              )}
            </dd>
          </div>
          {announcement.expires_at ? (
            <div>
              <dt>Expires</dt>
              <dd>{formatDate(announcement.expires_at)}</dd>
            </div>
          ) : null}
        </dl>

        <div className="button-row button-row--compact">
          <Link
            className="text-link"
            to={`/announcements/${announcement.id}`}
          >
            View announcement
          </Link>
          {actions}
        </div>
      </div>
    </article>
  );
}
