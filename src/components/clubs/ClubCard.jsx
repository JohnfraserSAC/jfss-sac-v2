import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getVisibleMeetingSchedule } from "../../utils/clubSchedule";
import { resolveClubLogoUrl } from "../../utils/clubMedia";
import { toSameOriginSupabaseUrl } from "../../utils/proxiedSupabaseUrl";

function initialLogoUrl(logoUrl) {
  if (typeof logoUrl !== "string") return null;
  const trimmed = logoUrl.trim();
  if (!trimmed || !/^https:\/\//i.test(trimmed)) return null;
  return toSameOriginSupabaseUrl(trimmed);
}

export function ClubCard({ club }) {
  const initial = club.name?.charAt(0)?.toUpperCase() || "C";
  const meetingSchedule = getVisibleMeetingSchedule(club.meeting_schedule);
  const [logoUrl, setLogoUrl] = useState(() => initialLogoUrl(club.logo_url));

  useEffect(() => {
    let active = true;

    async function resolveLogo() {
      const resolved = await resolveClubLogoUrl(club.logo_url);
      if (active) setLogoUrl(resolved);
    }

    void resolveLogo();
    return () => {
      active = false;
    };
  }, [club.logo_url]);

  return (
    <article className="club-card">
      <div className="club-card__media">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="club-card__logo"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="club-card__logo club-card__logo--fallback"
            aria-hidden="true"
          >
            {initial}
          </div>
        )}
      </div>

      <div className="club-card__body">
        <h2>
          <Link to={`/clubs/${club.slug}`}>{club.name}</Link>
        </h2>

        {club.description ? (
          <p className="club-card__summary">{club.description}</p>
        ) : (
          <p className="club-card__summary muted">
            No description provided.
          </p>
        )}

        <dl className="meta-list">
          {meetingSchedule ? (
            <div>
              <dt>Schedule</dt>
              <dd>{meetingSchedule}</dd>
            </div>
          ) : null}
          {club.meeting_location ? (
            <div>
              <dt>Location</dt>
              <dd>{club.meeting_location}</dd>
            </div>
          ) : null}
          {club.instagram_handle ? (
            <div>
              <dt>Instagram</dt>
              <dd>@{String(club.instagram_handle).replace(/^@/, "")}</dd>
            </div>
          ) : null}
          {club.contact_email ? (
            <div>
              <dt>Email</dt>
              <dd>{club.contact_email}</dd>
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
