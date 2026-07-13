import { Link } from "react-router-dom";

export function ClubCard({ club }) {
  const initial = club.name?.charAt(0)?.toUpperCase() || "C";

  return (
    <article className="club-card">
      <div className="club-card__media">
        {club.logo_url ? (
          <img src={club.logo_url} alt="" className="club-card__logo" />
        ) : (
          <div className="club-card__logo club-card__logo--fallback" aria-hidden="true">
            {initial}
          </div>
        )}
      </div>

      <div className="club-card__body">
        <h2>
          <Link to={`/clubs/${club.slug}`}>{club.name}</Link>
        </h2>

        {club.short_description ? (
          <p className="club-card__summary">{club.short_description}</p>
        ) : (
          <p className="club-card__summary muted">No short description provided.</p>
        )}

        <dl className="meta-list">
          {club.meeting_schedule ? (
            <div>
              <dt>Schedule</dt>
              <dd>{club.meeting_schedule}</dd>
            </div>
          ) : null}
          {club.meeting_location ? (
            <div>
              <dt>Location</dt>
              <dd>{club.meeting_location}</dd>
            </div>
          ) : null}
        </dl>

        <Link className="text-link" to={`/clubs/${club.slug}`}>
          View club details
        </Link>
      </div>
    </article>
  );
}
