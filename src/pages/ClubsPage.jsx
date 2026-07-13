import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ClubCard } from "../components/ClubCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
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
    return clubs.filter((club) => club.name.toLowerCase().includes(query));
  }, [clubs, search]);

  if (loading) {
    return <LoadingScreen message="Loading clubs…" />;
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Directory</p>
          <h1>Approved clubs</h1>
          <p className="lede">
            Browse officially approved clubs at John Fraser Secondary School.
          </p>
        </div>
      </header>

      <div className="toolbar">
        <TextInput
          id="club-search"
          label="Search clubs"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by club name"
        />
      </div>

      {notice ? (
        <div className="alert alert--success" role="status">
          <strong>Success</strong>
          <p>{notice}</p>
        </div>
      ) : null}

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      {!error && filtered.length === 0 ? (
        <EmptyState title="No clubs found">
          {search.trim()
            ? "No approved clubs match your search."
            : "There are no approved clubs to show yet."}
        </EmptyState>
      ) : (
        <div className="club-grid">
          {filtered.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
    </div>
  );
}
