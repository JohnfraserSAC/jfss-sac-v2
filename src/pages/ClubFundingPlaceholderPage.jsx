import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ClubFundingForm } from "../components/clubs/ClubFundingForm";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { getClubBySlug } from "../services/clubs";
import { getCurrentUserClubMembership } from "../services/memberships";
import { isClubOwner } from "../utils/clubPermissions";
import { getErrorMessage } from "../utils/errors";

export function ClubFundingPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextClub = await getClubBySlug(slug);
      if (!nextClub) {
        setClub(null);
        return;
      }
      setClub(nextClub);
      setMembership(
        await getCurrentUserClubMembership(nextClub.id, user.id),
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load this club."));
    } finally {
      setLoading(false);
    }
  }, [slug, user.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional async page fetch
    load();
  }, [load]);

  if (loading) {
    return <LoadingScreen message="Loading funding form…" />;
  }

  const canSubmit =
    membership?.status === "ACTIVE" && isClubOwner(membership.role);

  if (club && !canSubmit) {
    return <Navigate to={`/clubs/${club.slug}`} replace />;
  }

  if (!club) {
    return (
      <div className="page">
        <ErrorMessage>{error || "Club not found."}</ErrorMessage>
      </div>
    );
  }

  return (
    <div className="page narrow-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Club funding</p>
          <h1>{club.name}</h1>
          <p className="lede">
            Submit a request for school-related club materials.
          </p>
        </div>
        <Link className="text-link" to={`/clubs/${club.slug}/manage`}>
          Back to manage
        </Link>
      </header>
      <ClubFundingForm club={club} />
    </div>
  );
}
