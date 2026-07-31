import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { PermissionNotice } from "../components/PermissionNotice";
import { TextInput } from "../components/FormField";
import { StatusBadge } from "../components/StatusBadge";
import { listClubsByAnnualStatus } from "../services/clubs";
import { getAdminClubReapplicationQueue } from "../services/clubReapplications";
import { formatDate } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

const TITLES = {
  INACTIVE: "Inactive Clubs",
  PENDING_SUPERVISOR: "Pending Supervisor",
  ACTIVE: "Active Clubs",
  OVERDUE: "Overdue Supervisor",
};

export function AdminAnnualClubsPage({
  embedded = false,
  annualStatus = "INACTIVE",
}) {
  const { isSacAdmin, isSacExec } = useAuth();
  const canView = isSacAdmin || isSacExec;
  const [rows, setRows] = useState([]);
  const [pendingReapps, setPendingReapps] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const status =
        annualStatus === "PENDING_SUPERVISOR"
          ? "PENDING_SUPERVISOR"
          : annualStatus === "OVERDUE"
            ? "OVERDUE"
            : annualStatus;
      const data = await listClubsByAnnualStatus(status);
      setRows(data);

      if (annualStatus === "PENDING_SUPERVISOR") {
        const reapps = await getAdminClubReapplicationQueue({
          status: "ALL",
          search: "",
        });
        setPendingReapps(reapps);
      } else {
        setPendingReapps([]);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load clubs."));
    } finally {
      setLoading(false);
    }
  }, [annualStatus]);

  useEffect(() => {
    if (!canView) return;
    load();
  }, [canView, load]);

  if (!canView) {
    return (
      <PermissionNotice title="Exec access required">
        Club annual-state lists are limited to SAC administrators and executives.
      </PermissionNotice>
    );
  }

  const filtered = rows.filter((row) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const aliasText = (row.aliases || []).join(" ").toLowerCase();
    return row.name.toLowerCase().includes(q) || aliasText.includes(q);
  });

  if (loading) {
    return <LoadingScreen message="Loading clubs…" />;
  }

  return (
    <div className={embedded ? "exec-section" : "page"}>
      {!embedded ? (
        <header className="page-header">
          <h1>{TITLES[annualStatus] || "Clubs"}</h1>
        </header>
      ) : (
        <h2>{TITLES[annualStatus] || "Clubs"}</h2>
      )}

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <div className="toolbar">
        <TextInput
          id={`annual-club-search-${annualStatus}`}
          label="Search by name or alias"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {annualStatus === "PENDING_SUPERVISOR" && pendingReapps.length > 0 ? (
        <section className="stack" style={{ marginBottom: "1.5rem" }}>
          <h3>Open re-applications</h3>
          <ul className="stack card-list">
            {pendingReapps.map((request) => (
              <li key={request.id} className="card">
                <div className="card__header">
                  <h4>{request.clubs?.name || "Club"}</h4>
                  <StatusBadge status={request.status} />
                </div>
                <p className="muted">
                  {request.applicant_email} · {formatDate(request.submitted_at)}
                </p>
                <Link to="/exec-dashboard/reapplications">Open review queue</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="No clubs in this category"
          description="Nothing matches the current school-year annual status filter."
        />
      ) : (
        <ul className="stack card-list">
          {filtered.map((row) => (
            <li key={row.club_id} className="card">
              <div className="card__header">
                <h3>{row.name}</h3>
                <span className="badge">{row.annual_status}</span>
              </div>
              {row.aliases?.length ? (
                <p className="muted">Aliases: {row.aliases.join(", ")}</p>
              ) : null}
              {row.annual_status === "PENDING_SUPERVISOR" ? (
                <p>
                  Supervisor due:{" "}
                  {row.supervisor_due_at
                    ? formatDate(row.supervisor_due_at)
                    : "Not set"}
                  {row.is_overdue ? (
                    <span className="badge badge--danger"> OVERDUE</span>
                  ) : null}
                </p>
              ) : null}
              <p>
                <Link to={`/clubs/${row.slug}`}>View club</Link>
                {" · "}
                <Link to={`/clubs/${row.slug}/manage`}>Manage</Link>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
