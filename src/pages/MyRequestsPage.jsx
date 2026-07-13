import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { RequestCard } from "../components/RequestCard";
import { Spinner } from "../components/Spinner";
import {
  deleteDraftClubRequest,
  getMyClubRequests,
  resubmitClubRequest,
  withdrawClubRequest,
} from "../services/clubRequests";
import { getClubById } from "../services/clubs";
import { getErrorMessage } from "../utils/errors";

export function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [clubSlugs, setClubSlugs] = useState({});
  const [missingClubs, setMissingClubs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMyClubRequests(user.id);
      setRequests(data);

      const approved = data.filter((request) => request.created_club_id);
      const slugEntries = await Promise.all(
        approved.map(async (request) => {
          try {
            const club = await getClubById(request.created_club_id);
            return [
              request.created_club_id,
              club?.slug ?? null,
              !club,
            ];
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
      setError(getErrorMessage(loadError, "Could not load your requests."));
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
    return <LoadingScreen message="Loading your requests…" />;
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Your applications</p>
          <h1>My club requests</h1>
          <p className="lede">
            Track the status of clubs you have asked SAC to create.
          </p>
        </div>
      </header>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}

      {!error && requests.length === 0 ? (
        <EmptyState title="No requests yet">
          When you submit a club registration, it will appear here.
        </EmptyState>
      ) : (
        <div className="stack">
          {requests.map((request) => {
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
                      {(request.status === "DRAFT" ||
                        request.status === "CHANGES_REQUESTED") && (
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
                          {isBusy ? <Spinner size="sm" label="Working" /> : null}
                          {request.status === "DRAFT"
                            ? "Submit"
                            : "Resubmit"}
                        </button>
                      )}

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
        </div>
      )}
    </div>
  );
}
