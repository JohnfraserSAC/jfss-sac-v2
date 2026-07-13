import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ClubRoleBadge } from "../components/ClubRoleBadge";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { StatusBadge } from "../components/StatusBadge";
import { getClubBySlug } from "../services/clubs";
import { getMyMembershipForClub } from "../services/memberships";
import {
  canManageClubMembers,
  getClubRoleLabel,
} from "../utils/clubPermissions";
import { getErrorMessage } from "../utils/errors";

export function ClubDetailPage() {
  const { slug } = useParams();
  const { user, isAuthenticated, isAdmin, isSacAdmin, isSiteAdmin } = useAuth();
  const [club, setClub] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setMembership(null);

      try {
        const nextClub = await getClubBySlug(slug);
        if (!active) return;

        if (!nextClub) {
          setClub(null);
          setError("");
          setLoading(false);
          return;
        }

        setClub(nextClub);

        if (isAuthenticated && user?.id) {
          try {
            const nextMembership = await getMyMembershipForClub(
              user.id,
              nextClub.id,
            );
            if (!active) return;
            setMembership(nextMembership);
          } catch (membershipError) {
            console.error(membershipError);
          }
        }
      } catch (loadError) {
        if (!active) return;
        setError(getErrorMessage(loadError, "Could not load this club."));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [slug, isAuthenticated, user?.id]);

  if (loading) {
    return <LoadingScreen message="Loading club…" />;
  }

  if (error) {
    return (
      <div className="page">
        <ErrorMessage>{error}</ErrorMessage>
        <Link className="text-link" to="/clubs">
          Back to clubs
        </Link>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="page">
        <EmptyState title="Club not found">
          This club does not exist or is not publicly available.
        </EmptyState>
        <Link className="text-link" to="/clubs">
          Back to clubs
        </Link>
      </div>
    );
  }

  const initial = club.name?.charAt(0)?.toUpperCase() || "C";
  const showStatus = isAdmin || club.status !== "APPROVED";
  const canManage = canManageClubMembers({
    clubRole: membership?.role,
    isSacAdmin,
    isSiteAdmin,
  });

  return (
    <div className="page">
      <div className="club-hero">
        {club.banner_url ? (
          <img src={club.banner_url} alt="" className="club-hero__banner" />
        ) : (
          <div className="club-hero__banner club-hero__banner--fallback" />
        )}

        <div className="club-hero__content">
          {club.logo_url ? (
            <img src={club.logo_url} alt="" className="club-hero__logo" />
          ) : (
            <div
              className="club-hero__logo club-hero__logo--fallback"
              aria-hidden="true"
            >
              {initial}
            </div>
          )}

          <div>
            <p className="eyebrow">Club</p>
            <h1>{club.name}</h1>
            {club.short_description ? (
              <p className="lede">{club.short_description}</p>
            ) : null}
            <div className="badge-row">
              {showStatus ? <StatusBadge status={club.status} /> : null}
              {membership ? <ClubRoleBadge role={membership.role} /> : null}
            </div>
          </div>
        </div>
      </div>

      <section className="panel">
        <h2>About</h2>
        <p className="prose">{club.description}</p>
      </section>

      <section className="panel">
        <h2>Details</h2>
        <dl className="meta-list">
          <div>
            <dt>Contact email</dt>
            <dd>{club.contact_email || "Not provided"}</dd>
          </div>
          <div>
            <dt>Meeting schedule</dt>
            <dd>{club.meeting_schedule || "Not provided"}</dd>
          </div>
          <div>
            <dt>Meeting location</dt>
            <dd>{club.meeting_location || "Not provided"}</dd>
          </div>
          {membership ? (
            <div>
              <dt>Your role in this club</dt>
              <dd>
                {club.name} · Role: {getClubRoleLabel(membership.role)} ·{" "}
                {membership.status}
              </dd>
            </div>
          ) : null}
        </dl>

        {canManage ? (
          <div className="button-row">
            <Link
              className="button button--primary"
              to={`/clubs/${club.slug}/manage`}
            >
              Manage Club
            </Link>
          </div>
        ) : null}
      </section>

      <Link className="text-link" to="/clubs">
        Back to clubs
      </Link>
    </div>
  );
}
