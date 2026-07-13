import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ClubRoleBadge } from "../components/ClubRoleBadge";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { StatusBadge } from "../components/StatusBadge";
import { getMyClubMemberships } from "../services/memberships";
import {
  canManageClubMembers,
  getClubRoleLabel,
} from "../utils/clubPermissions";
import { formatDate } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

export function MyClubsPage() {
  const { user, isSacAdmin, isSiteAdmin } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getMyClubMemberships(user.id);
        if (!active) return;
        setMemberships(data);
      } catch (loadError) {
        if (!active) return;
        setError(getErrorMessage(loadError, "Could not load your clubs."));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [user.id]);

  if (loading) {
    return <LoadingScreen message="Loading your clubs…" />;
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Memberships</p>
          <h1>My clubs</h1>
          <p className="lede">
            Clubs where you are an owner, executive, or member. Each row is one
            club-scoped membership.
          </p>
        </div>
      </header>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      {!error && memberships.length === 0 ? (
        <EmptyState title="No club memberships yet">
          Approved club ownership or membership will appear here after a club
          request is approved or you are added to a club.
        </EmptyState>
      ) : (
        <div className="stack">
          {memberships.map((membership) => {
            const club = membership.clubs;
            const canManage = canManageClubMembers({
              clubRole: membership.role,
              isSacAdmin,
              isSiteAdmin,
            });

            return (
              <article
                key={`${membership.club_id}-${membership.user_id}`}
                className="panel membership-card"
              >
                <div className="section-heading">
                  <div>
                    <h2>{club?.name || "Unknown club"}</h2>
                    <p className="membership-role-line">
                      Role: {getClubRoleLabel(membership.role)}
                    </p>
                    <div className="badge-row">
                      <ClubRoleBadge role={membership.role} />
                      <StatusBadge status={membership.status} />
                      {club?.status ? (
                        <StatusBadge status={club.status} />
                      ) : null}
                    </div>
                  </div>
                  <div className="button-row button-row--compact">
                    {club?.slug ? (
                      <Link className="text-link" to={`/clubs/${club.slug}`}>
                        View club
                      </Link>
                    ) : null}
                    {canManage && club?.slug ? (
                      <Link
                        className="button button--secondary"
                        to={`/clubs/${club.slug}/manage`}
                      >
                        Manage Club
                      </Link>
                    ) : null}
                  </div>
                </div>

                <dl className="meta-list">
                  <div>
                    <dt>Joined</dt>
                    <dd>{formatDate(membership.joined_at)}</dd>
                  </div>
                  {club?.short_description ? (
                    <div>
                      <dt>Summary</dt>
                      <dd>{club.short_description}</dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
