import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { RequestCard } from "../components/clubs/RequestCard";
import { Spinner } from "../components/ui/Spinner";
import {
  deleteDraftClubRequest,
  getMyClubRequests,
  resubmitClubRequest,
  withdrawClubRequest,
} from "../services/clubRequests";
import { getClubById } from "../services/clubs";
import { getErrorMessage } from "../utils/errors";

const PAGE_SIZE = 5;

export function MyClubApplicationsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [clubSlugs, setClubSlugs] = useState({});
  const [missingClubs, setMissingClubs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMyClubRequests(user.id);
      setRequests(data);
      setVisibleCount(PAGE_SIZE);

      const approved = data.filter((request) => request.created_club_id);
      const slugEntries = await Promise.all(
        approved.map(async (request) => {
          try {
            const club = await getClubById(request.created_club_id);
            return [request.created_club_id, club?.slug ?? null, !club];
          } catch {
            return [request.created_club_id, null, true];
          }
        }),
      );
      setClubSlugs(
        Object.fromEntries(slugEntries.map(([id, slug]) => [id, slug])),
      );
      setMissingClubs(
        Object.fromEntries(
          slugEntries.map(([id, , missing]) => [id, Boolean(missing)]),
        ),
      );
    } catch (loadError) {
      setError(
        getErrorMessage(loadError, "Could not load your club applications."),
      );
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function runAction(requestId, action) {
    setBusyId(requestId);
    setActionError("");
    try {
      await action();
      await loadRequests();
    } catch (actionErr) {
      setActionError(getErrorMessage(actionErr, "Action failed."));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading club applications…" />;
  }

  const visible = requests.slice(0, visibleCount);
  const hasMore = visibleCount < requests.length;

  return (
    <div className="stack">
      <header className="page-header">
        <Link className="button button--secondary" to="/clubs/apply">
          Apply for a new club
        </Link>
      </header>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}

      {!error && requests.length === 0 ? (
        <EmptyState title="No club applications yet">
          Start a new club application to see it tracked here.
        </EmptyState>
      ) : null}

      {visible.map((request) => {
        const canMutate =
          request.status === "DRAFT" ||
          request.status === "CHANGES_REQUESTED";
        const isBusy = busyId === request.id;

        return (
          <RequestCard
            key={request.id}
            request={request}
            createdClubSlug={clubSlugs[request.created_club_id]}
            createdClubMissing={
              !request.created_club_id ||
              Boolean(missingClubs[request.created_club_id])
            }
            actions={
              canMutate ? (
                <div className="button-row">
                  {request.status === "CHANGES_REQUESTED" ? (
                    <button
                      type="button"
                      className="button button--primary"
                      disabled={isBusy}
                      onClick={() =>
                        runAction(request.id, () =>
                          resubmitClubRequest(request.id),
                        )
                      }
                    >
                      {isBusy ? (
                        <Spinner size="sm" label="Working" />
                      ) : null}
                      Resubmit
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="button button--secondary"
                    disabled={isBusy}
                    onClick={() =>
                      runAction(request.id, () =>
                        withdrawClubRequest(request.id),
                      )
                    }
                  >
                    Withdraw
                  </button>
                  {request.status === "DRAFT" ? (
                    <button
                      type="button"
                      className="button button--danger"
                      disabled={isBusy}
                      onClick={() =>
                        runAction(request.id, () =>
                          deleteDraftClubRequest(request.id),
                        )
                      }
                    >
                      Delete draft
                    </button>
                  ) : null}
                </div>
              ) : null
            }
          />
        );
      })}

      {hasMore ? (
        <div className="button-row">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
          >
            View more
          </button>
        </div>
      ) : null}
    </div>
  );
}
