import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnnouncementCard } from "./AnnouncementCard";
import { EmptyState } from "./EmptyState";
import { ErrorMessage } from "./ErrorMessage";
import { Spinner } from "./Spinner";
import { getHomepageAnnouncements } from "../services/announcements";
import { getErrorMessage } from "../utils/errors";

export function HomepageAnnouncements({ limit = 5 }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getHomepageAnnouncements(limit);
        if (!active) return;
        setAnnouncements(data);
      } catch (loadError) {
        if (!active) return;
        setError(
          getErrorMessage(loadError, "Could not load latest announcements."),
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [limit]);

  return (
    <section className="panel homepage-announcements">
      <div className="section-heading">
        <div>
          <p className="eyebrow">News</p>
          <h2>Latest announcements</h2>
        </div>
        <Link className="text-link" to="/announcements">
          View all announcements
        </Link>
      </div>

      {loading ? (
        <p className="muted">
          <Spinner size="sm" label="Loading" /> Loading announcements…
        </p>
      ) : null}

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      {!loading && !error && announcements.length === 0 ? (
        <EmptyState title="No announcements yet">
          Published announcements will appear here.
        </EmptyState>
      ) : null}

      {!loading && !error && announcements.length > 0 ? (
        <div className="announcement-grid">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
