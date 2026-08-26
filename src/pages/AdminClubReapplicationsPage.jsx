import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ExecReviewQueueCard } from "../components/exec/ExecReviewQueueCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { PermissionNotice } from "../components/ui/PermissionNotice";
import { Select } from "../components/ui/Select";
import { TextInput } from "../components/ui/TextInput";
import { getAdminClubReapplicationQueue } from "../services/clubReapplications";
import { getErrorMessage } from "../utils/errors";

export function AdminClubReapplicationsPage({ embedded = false }) {
  const location = useLocation();
  const { isSacAdmin, isSacExec } = useAuth();
  const canView = isSacAdmin || isSacExec;

  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const state = location.state;
    if (state?.success) {
      setSuccess(state.success);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminClubReapplicationQueue({ status, search });
      setRequests(data);
    } catch (loadError) {
      setError(
        getErrorMessage(loadError, "Could not load re-application queue."),
      );
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    if (!canView) return;
    const handle = window.setTimeout(loadQueue, 250);
    return () => window.clearTimeout(handle);
  }, [loadQueue, canView]);

  if (!canView) {
    return (
      <PermissionNotice title="Exec access required">
        Club re-application review is limited to SAC administrators and
        executives.
      </PermissionNotice>
    );
  }

  if (loading && requests.length === 0) {
    return <LoadingScreen message="Loading re-applications…" />;
  }

  return (
    <div className={embedded ? "exec-section" : "page"}>
      {!embedded ? (
        <header className="page-header">
          <h1>Re-Application Review</h1>
        </header>
      ) : (
        <div className="section-heading-row">
          <h2 className="exec-section__title">Pending Reapplications</h2>
          {!isSacAdmin ? (
            <span className="badge badge--role badge--role-sac-exec">
              Read only
            </span>
          ) : null}
        </div>
      )}

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {success ? (
        <div className="alert alert--success" role="status">
          {success}
        </div>
      ) : null}

      <div className="toolbar grid-2">
        <Select
          id="reapp-status"
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="ALL">Open queue</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="CHANGES_REQUESTED">Changes requested</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </Select>
        <TextInput
          id="reapp-search"
          label="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="No re-applications"
          description="Nothing matches this filter."
        />
      ) : (
        <div className="exec-queue-list">
          {requests.map((request) => {
            const clubName = request.clubs?.name || "Unknown club";
            return (
              <ExecReviewQueueCard
                key={request.id}
                to={`/exec-dashboard/applications/reapplications/${request.id}`}
                title={clubName}
                submitter={request.applicant_email || "Unknown submitter"}
                status={request.status}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
