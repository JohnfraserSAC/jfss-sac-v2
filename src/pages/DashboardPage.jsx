import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ClubRoleBadge } from "../components/ClubRoleBadge";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { RequestCard } from "../components/RequestCard";
import { RoleBadge } from "../components/RoleBadge";
import { StatusBadge } from "../components/StatusBadge";
import { getDashboardSummary } from "../services/clubRequests";
import { getClubById } from "../services/clubs";
import { getMyClubMemberships } from "../services/memberships";
import { getClubRoleLabel } from "../utils/clubPermissions";
import { displayName, formatDate } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

export function DashboardPage() {
  const {
    user,
    profile,
    systemRoles,
    isAdmin,
    authError,
    refreshRoles,
    refreshProfile,
  } = useAuth();
  const [summary, setSummary] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [membershipsError, setMembershipsError] = useState("");
  const [clubSlugs, setClubSlugs] = useState({});
  const [missingClubs, setMissingClubs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setMembershipsError("");

      try {
        await Promise.all([
          refreshProfile(user.id).catch(() => null),
          refreshRoles(user.id).catch(() => null),
        ]);

        const [nextSummary, nextMemberships] = await Promise.all([
          getDashboardSummary(user.id),
          getMyClubMemberships(user.id).catch((membershipError) => {
            setMembershipsError(
              getErrorMessage(
                membershipError,
                "Could not load your club roles.",
              ),
            );
            return [];
          }),
        ]);

        if (!active) return;

        setSummary(nextSummary);
        setMemberships(nextMemberships);

        const approved = (nextSummary.recentRequests || []).filter(
          (request) => request.created_club_id,
        );

        const slugEntries = await Promise.all(
          approved.map(async (request) => {
            try {
              const club = await getClubById(request.created_club_id);
              return [request.created_club_id, club?.slug ?? null, !club];
            } catch {
              return [request.created_club_id, null, true];
            }
          }),
        );

        if (!active) return;
        setClubSlugs(
          Object.fromEntries(slugEntries.map(([id, slug]) => [id, slug])),
        );
        setMissingClubs(
          Object.fromEntries(
            slugEntries.map(([id, , missing]) => [id, Boolean(missing)]),
          ),
        );
      } catch (loadError) {
        if (!active) return;
        setError(getErrorMessage(loadError, "Could not load your dashboard."));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [user.id, refreshProfile, refreshRoles]);

  if (loading) {
    return <LoadingScreen message="Loading dashboard…" />;
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>{displayName(profile, user)}</h1>
          <p className="lede">Your profile, roles, requests, and memberships.</p>
        </div>
      </header>

      {authError ? <ErrorMessage>{authError}</ErrorMessage> : null}
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <section className="panel">
        <h2>Profile summary</h2>
        <dl className="meta-list">
          <div>
            <dt>Email</dt>
            <dd>{profile?.email || user.email}</dd>
          </div>
          <div>
            <dt>Full name</dt>
            <dd>{profile?.full_name || "Not set"}</dd>
          </div>
          <div>
            <dt>Graduation year</dt>
            <dd>{profile?.graduation_year || "Not set"}</dd>
          </div>
          <div>
            <dt>Profile status</dt>
            <dd>
              {profile
                ? profile.is_active
                  ? "Active"
                  : "Inactive"
                : "Profile missing"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <h2>Your roles</h2>
        <p className="muted">
          System roles apply across the portal. Club roles apply only to a
          specific club.
        </p>

        <div className="role-section">
          <h3>System roles</h3>
          {systemRoles.length === 0 ? (
            <p className="muted">No system roles assigned.</p>
          ) : (
            <ul className="role-list">
              {systemRoles.map((role) => (
                <li key={role.code}>
                  <div className="role-list__item">
                    <RoleBadge role={role.code} />
                    <div>
                      <strong>{role.name || role.code}</strong>
                      {role.description ? <p>{role.description}</p> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="role-section">
          <h3>Club roles</h3>
          {membershipsError ? (
            <ErrorMessage>{membershipsError}</ErrorMessage>
          ) : null}
          {!membershipsError && memberships.length === 0 ? (
            <p className="muted">
              You are not an owner, executive, or member of any club yet.
            </p>
          ) : null}
          {memberships.length > 0 ? (
            <ul className="role-list">
              {memberships.map((membership) => {
                const club = membership.clubs;
                return (
                  <li key={`${membership.club_id}-${membership.user_id}`}>
                    <div className="role-list__item">
                      <ClubRoleBadge role={membership.role} />
                      <div>
                        <strong>{club?.name || "Unknown club"}</strong>
                        <p>
                          Role: {getClubRoleLabel(membership.role)}
                          {membership.status !== "ACTIVE"
                            ? ` · ${membership.status}`
                            : ""}
                        </p>
                        <p className="muted">
                          Joined {formatDate(membership.joined_at)}
                        </p>
                        {club?.slug ? (
                          <Link className="text-link" to={`/clubs/${club.slug}`}>
                            View club
                          </Link>
                        ) : null}
                      </div>
                      {club?.status ? (
                        <StatusBadge status={club.status} />
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="stat-grid">
        <div className="stat-card">
          <h2>Club requests</h2>
          {summary?.errors?.requests ? (
            <ErrorMessage>{summary.errors.requests}</ErrorMessage>
          ) : (
            <p className="stat-value">{summary?.requestCount ?? 0}</p>
          )}
        </div>
        <div className="stat-card">
          <h2>Active memberships</h2>
          {summary?.errors?.memberships ? (
            <ErrorMessage>{summary.errors.memberships}</ErrorMessage>
          ) : (
            <p className="stat-value">{summary?.activeMembershipCount ?? 0}</p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Recent requests</h2>
          <Link className="text-link" to="/my-requests">
            View all
          </Link>
        </div>

        {summary?.errors?.requests ? (
          <ErrorMessage>{summary.errors.requests}</ErrorMessage>
        ) : summary?.recentRequests?.length ? (
          <div className="stack">
            {summary.recentRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                createdClubSlug={clubSlugs[request.created_club_id]}
                createdClubMissing={
                  !request.created_club_id ||
                  Boolean(missingClubs[request.created_club_id])
                }
              />
            ))}
          </div>
        ) : (
          <p className="muted">You have not submitted any club requests yet.</p>
        )}
      </section>

      <section className="panel">
        <h2>Quick actions</h2>
        <div className="button-row">
          <Link to="/register-club" className="button button--primary">
            Register a club
          </Link>
          <Link to="/my-clubs" className="button button--secondary">
            My clubs
          </Link>
          {isAdmin ? (
            <Link to="/admin/club-requests" className="button button--secondary">
              Review club requests
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
