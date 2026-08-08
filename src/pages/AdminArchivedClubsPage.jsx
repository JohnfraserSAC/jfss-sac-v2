import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { PermissionNotice } from "../components/ui/PermissionNotice";
import { TextInput } from "../components/ui/TextInput";
import { StatusBadge } from "../components/ui/StatusBadge";
import { listArchivedClubs } from "../services/clubs";
import { formatDate } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

export function AdminArchivedClubsPage({ embedded = false }) {
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
      const data = await listArchivedClubs(search);
      setRows(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load archived clubs."));
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
        Archived clubs are limited to SAC administrators and executives.
      </PermissionNotice>
    );
  }

  if (loading && rows.length === 0) {
    return <LoadingScreen message="Loading archived clubs…" />;
  }

  return (
    <div className={embedded ? "exec-section" : "page"}>
      {!embedded ? (
        <header className="page-header">
          <h1>Archived Clubs</h1>
        </header>
      ) : (
        <h2>Archived Clubs</h2>
      )}

      <p className="lede">
        Soft-archived historical clubs keep their permanent identity and may be
        re-applied for. Clubs created through new-club applications that owners
        permanently remove do not appear here.
        {isSacExec && !isSacAdmin ? " SAC Exec access is read-only." : null}
      </p>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <div className="toolbar">
        <TextInput
          id="archived-club-search"
          label="Search archived clubs"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No archived clubs"
          description="Owner-archived clubs appear here with their history preserved."
        />
      ) : (
        <ul className="stack card-list">
          {rows.map((row) => (
            <li key={row.club_id} className="card">
              <div className="card__header">
                <h3>{row.name}</h3>
                <StatusBadge status="ARCHIVED" />
              </div>
              <dl className="meta-list">
                <div>
                  <dt>Previous active year</dt>
                  <dd>{row.last_active_school_year || "Unknown"}</dd>
                </div>
                <div>
                  <dt>Archived date</dt>
                  <dd>
                    {row.archived_at ? formatDate(row.archived_at) : "Unknown"}
                  </dd>
                </div>
                <div>
                  <dt>Archived by</dt>
                  <dd>
                    {row.archived_by_name ||
                      row.archived_by_email ||
                      "Unknown owner"}
                  </dd>
                </div>
                <div>
                  <dt>Historical applications</dt>
                  <dd>
                    {(row.registration_request_count || 0) +
                      (row.reapplication_request_count || 0)}{" "}
                    total ({row.registration_request_count || 0} new ·{" "}
                    {row.reapplication_request_count || 0} re-apply)
                  </dd>
                </div>
                <div>
                  <dt>Origin</dt>
                  <dd>{row.creation_origin || "UNKNOWN"}</dd>
                </div>
                <div>
                  <dt>Reapply availability</dt>
                  <dd>
                    {row.eligible_for_reapplication
                      ? "Available in re-application selector"
                      : "Not currently eligible"}
                  </dd>
                </div>
              </dl>
              <p className="muted">Slug: {row.slug}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
