import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnnouncementCard } from "../components/announcements/AnnouncementCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { Select } from "../components/ui/Select";
import { TextInput } from "../components/ui/TextInput";
import { getPublishedAnnouncements } from "../services/announcements";
import { getErrorMessage } from "../utils/errors";

const PAGE_SIZE = 5;

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);

  const filters = useMemo(() => ({ search, type }), [search, type]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getPublishedAnnouncements({
          ...filters,
          limit: PAGE_SIZE,
          offset: 0,
        });
        if (!active) return;
        setAnnouncements(data);
        setHasMore(data.length === PAGE_SIZE);
      } catch (loadError) {
        if (!active) return;
        setError(getErrorMessage(loadError, "Could not load announcements."));
      } finally {
        if (active) setLoading(false);
      }
    }

    const handle = window.setTimeout(load, 250);
    return () => {
      active = false;
      window.clearTimeout(handle);
    };
  }, [filters]);

  async function loadMore() {
    setLoadingMore(true);
    setError("");

    try {
      const data = await getPublishedAnnouncements({
        ...filters,
        limit: PAGE_SIZE,
        offset: announcements.length,
      });
      setAnnouncements((current) => [...current, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load more announcements."));
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading announcements…" />;
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">News</p>
          <h1>Announcements</h1>
          <p className="lede">
            Published updates from SAC, faculty advisors, and approved clubs.
          </p>
        </div>
      </header>

      <div className="toolbar toolbar--split">
        <TextInput
          id="announcement-search"
          label="Search announcements"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title or summary"
        />
        <Select
          id="announcement-type-filter"
          label="Filter by type"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option value="ALL">All</option>
          <option value="GENERAL">General</option>
          <option value="CLUB">Club announcements</option>
        </Select>
      </div>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      {!error && announcements.length === 0 ? (
        <EmptyState title="No announcements yet">
          There are no published announcements to show right now.
        </EmptyState>
      ) : (
        <div className="announcement-grid">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
            />
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="button-row">
          <button
            type="button"
            className="button button--secondary"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : "See more"}
          </button>
        </div>
      ) : null}

      <p className="note">
        Looking for clubs?{" "}
        <Link className="text-link" to="/clubs">
          Browse approved clubs
        </Link>
        .
      </p>
    </div>
  );
}
