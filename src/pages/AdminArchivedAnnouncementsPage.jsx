import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { PermissionNotice } from "../components/PermissionNotice";
import { TextInput } from "../components/FormField";
import { AnnouncementStatusBadge } from "../components/AnnouncementStatusBadge";
import { AnnouncementTypeBadge } from "../components/AnnouncementTypeBadge";
import { getArchivedAnnouncements } from "../services/announcements";
import { formatDate } from "../utils/format";
import { formatDateOnly } from "../utils/torontoDate";
import { getErrorMessage } from "../utils/errors";

export function AdminArchivedAnnouncementsPage({ embedded = false }) {
  const { isSacAdmin, isSacExec } = useAuth();
  const canView = isSacAdmin || isSacExec;
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getArchivedAnnouncements({ search });
      setRows(data);
    } catch (loadError) {
      setError(
        getErrorMessage(loadError, "Could not load archived announcements."),
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!canView) return;
    const timer = setTimeout(() => {
      load();
    }, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [canView, load, search]);

  if (!canView) {
    return (
      <PermissionNotice title="Exec access required">
        Archived announcements are limited to SAC administrators and executives.
      </PermissionNotice>
    );
  }

  if (loading && rows.length === 0) {
    return <LoadingScreen message="Loading archived announcements…" />;
  }

  return (
    <div className={embedded ? "exec-section" : "page"}>
      {!embedded ? (
        <header className="page-header">
          <h1>Archived Announcements</h1>
        </header>
      ) : (
        <h2 className="exec-section__title">Archived Announcements</h2>
      )}

      <p className="lede">
        Announcements that were approved, posted for their scheduled Toronto
        day, and then automatically archived. Rejected and cancelled requests
        are not listed here.
      </p>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <div className="toolbar">
        <TextInput
          id="archived-announcement-search"
          label="Search archived announcements"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {!error && rows.length === 0 ? (
        <EmptyState title="No archived announcements">
          Completed posts will appear here after their Toronto posting day ends.
        </EmptyState>
      ) : (
        <div className="stack">
          {rows.map((announcement) => {
            const club = announcement.clubs;
            return (
              <article
                key={announcement.id}
                className="panel admin-request-card"
              >
                <div className="section-heading">
                  <div>
                    <h3>{announcement.title}</h3>
                    <div className="badge-row">
                      <AnnouncementStatusBadge status={announcement.status} />
                      <AnnouncementTypeBadge club={club} />
                    </div>
                  </div>
                  <Link
                    className="text-link"
                    to={`/announcements/${announcement.id}`}
                  >
                    Open detail
                  </Link>
                </div>

                {announcement.summary ? <p>{announcement.summary}</p> : null}
                <div className="prose">{announcement.body}</div>

                <dl className="meta-list">
                  <div>
                    <dt>Club</dt>
                    <dd>{club?.name || "General"}</dd>
                  </div>
                  <div>
                    <dt>Scheduled posting date</dt>
                    <dd>
                      {formatDateOnly(announcement.scheduled_posting_date)}
                    </dd>
                  </div>
                  <div>
                    <dt>Approved</dt>
                    <dd>{formatDate(announcement.reviewed_at)}</dd>
                  </div>
                  <div>
                    <dt>Published</dt>
                    <dd>{formatDate(announcement.published_at)}</dd>
                  </div>
                  <div>
                    <dt>Archived</dt>
                    <dd>{formatDate(announcement.archived_at)}</dd>
                  </div>
                  {announcement.review_notes ? (
                    <div>
                      <dt>Review notes</dt>
                      <dd>{announcement.review_notes}</dd>
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
