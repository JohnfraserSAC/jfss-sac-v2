import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ClubCard } from "../components/ClubCard";
import { ClubGridSkeleton } from "../components/ClubCardSkeleton";
import { ClubsSubnav } from "../components/ClubsSubnav";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { TextInput } from "../components/FormField";
import { getApprovedClubs } from "../services/clubs";
import { getErrorMessage } from "../utils/errors";

export function ClubsPage() {
  const location = useLocation();
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || "");

  useEffect(() => {
    if (location.state?.notice) {
      setNotice(location.state.notice);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadClubs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getApprovedClubs();
      setClubs(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load clubs."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getApprovedClubs();
        if (!active) return;
        setClubs(data);
      } catch (loadError) {
        if (!active) return;
        setError(getErrorMessage(loadError, "Could not load clubs."));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clubs;
    return clubs.filter((club) => {
      const haystack = [
        club.name,
        club.short_description,
        club.instagram_handle,
        club.contact_email,
        club.meeting_location,
        club.meeting_schedule,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [clubs, search]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Clubs</p>
          <h1>Explore</h1>
          <p className="lede">
            Browse officially approved clubs at John Fraser Secondary School.
          </p>
        </div>
      </header>

      <ClubsSubnav />

      <div className="toolbar">
        <TextInput
          id="club-search"
          label="Search clubs"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by club name"
          disabled={loading}
        />
      </div>

      {notice ? (
        <div className="alert alert--success" role="status">
          <strong>Success</strong>
          <p>{notice}</p>
        </div>
      ) : null}

      {error ? (
        <div className="stack">
          <ErrorMessage>{error}</ErrorMessage>
          <button
            type="button"
            className="button button--secondary"
            onClick={loadClubs}
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading ? <ClubGridSkeleton count={6} /> : null}

      {!loading && !error && filtered.length === 0 ? (
        <EmptyState
          title="No clubs are currently available."
          action={
            <Link className="text-link" to="/">
              Back to home
            </Link>
          }
        >
          {search.trim()
            ? "No approved clubs match your search. Try a different name or clear the search."
            : "There are no publicly active clubs to show right now. Check back after clubs are approved for this school year."}
        </EmptyState>
      ) : null}

      {!loading && !error && filtered.length > 0 ? (
        <div className="club-grid">
          {filtered.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
