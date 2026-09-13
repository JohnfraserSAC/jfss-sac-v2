import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArchiveClubDialog } from "../components/clubs/ArchiveClubDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { PermissionNotice } from "../components/ui/PermissionNotice";
import { StatusBadge } from "../components/ui/StatusBadge";
import { TextInput } from "../components/ui/TextInput";
import { listAdminClubs } from "../services/clubs";
import { archiveSuccessNotice } from "../utils/clubOrigin";
import { getErrorMessage } from "../utils/errors";

export function AdminClubsPage({ embedded = false }) {
  const location = useLocation();
  const { isSacAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || "");
  const [archiveTarget, setArchiveTarget] = useState(null);

  useEffect(() => {
    if (location.state?.notice) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- consume navigation feedback
      setNotice(location.state.notice);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminClubs(search);
      setRows(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load clubs."));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!isSacAdmin) return;
    const timer = setTimeout(() => {
      load();
    }, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [isSacAdmin, load, search]);

  if (!isSacAdmin) {
    return (
      <PermissionNotice title="Site admin access required">
        Only site administrators can view and archive every club.
      </PermissionNotice>
    );
  }

  if (loading && rows.length === 0) {
    return <LoadingScreen message="Loading clubs…" />;
  }

  return (
    <div className={embedded ? "exec-section" : "page"}>
      {!embedded ? (
        <header className="page-header">
          <h1>Clubs</h1>
        </header>
      ) : (
        <h2 className="exec-section__title">Clubs</h2>
      )}

      <p className="lede">
        Archive any current club, including clubs you do not own.
      </p>

      {notice ? (
        <div className="alert alert--success" role="status">
          <strong>Success</strong>
          <p>{notice}</p>
        </div>
      ) : null}

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <div className="toolbar">
        <TextInput
          id="admin-club-search"
          label="Search clubs"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No clubs">
          There are no current clubs to archive.
        </EmptyState>
      ) : (
        <div className="stack">
          {rows.map((row) => (
            <article key={row.club_id} className="panel">
              <div className="section-heading">
                <div>
                  <h2>{row.name}</h2>
                  <div className="badge-row">
                    <StatusBadge status={row.status} />
                    {row.annual_status ? (
                      <StatusBadge status={row.annual_status} />
                    ) : null}
                  </div>
                </div>
                <div className="button-row button-row--compact">
                  {row.slug ? (
                    <>
                      <Link className="text-link" to={`/clubs/${row.slug}`}>
                        View
                      </Link>
                      <Link
                        className="button button--secondary"
                        to={`/clubs/${row.slug}/manage`}
                      >
                        Manage
                      </Link>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="button button--danger"
                    onClick={() =>
                      setArchiveTarget({
                        id: row.club_id,
                        name: row.name,
                        status: row.status,
                        creation_origin: row.creation_origin,
                      })
                    }
                  >
                    Archive
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ArchiveClubDialog
        open={Boolean(archiveTarget)}
        club={archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onSuccess={({ clubName, outcome }) => {
          setArchiveTarget(null);
          setNotice(archiveSuccessNotice(clubName, outcome));
          void load();
        }}
      />
    </div>
  );
}
