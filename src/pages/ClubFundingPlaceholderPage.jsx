import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { getClubBySlug } from "../services/clubs";
import { getCurrentUserClubMembership } from "../services/memberships";
import { isClubLeader } from "../utils/clubPermissions";
import { getErrorMessage } from "../utils/errors";

export function ClubFundingPlaceholderPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const nextClub = await getClubBySlug(slug);
      if (!nextClub) {
        setClub(null);
        return;
      }
      setClub(nextClub);
      const membership = await getCurrentUserClubMembership(
        nextClub.id,
        user.id,
      );
      if (
        membership?.status !== "ACTIVE" ||
        !isClubLeader(membership.role)
      ) {
        setUnauthorized(true);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load this club."));
    } finally {
      setLoading(false);
    }
  }, [slug, user.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingScreen message="Loading…" />;
  }

  if (unauthorized && club) {
    return <Navigate to={`/clubs/${club.slug}/manage`} replace />;
  }

  if (!club) {
    return (
      <div className="page">
        <ErrorMessage>Club not found.</ErrorMessage>
      </div>
    );
  }

  return (
    <div className="page narrow-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{club.name}</p>
          <h1>Club Funding Request</h1>
        </div>
        <Link className="text-link" to={`/clubs/${club.slug}/manage`}>
          Back to manage
        </Link>
      </header>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <section className="panel">
        <p>Club funding requests are coming soon.</p>
      </section>
    </div>
  );
}
