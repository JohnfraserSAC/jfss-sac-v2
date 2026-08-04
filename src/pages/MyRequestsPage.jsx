import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { RequestCard } from "../components/RequestCard";
import { StatusBadge } from "../components/StatusBadge";
import { Spinner } from "../components/Spinner";
import {
  deleteDraftClubRequest,
  getMyClubRequests,
  resubmitClubRequest,
  withdrawClubRequest,
} from "../services/clubRequests";
import {
  getMyClubReapplications,
  getReapplicationDisplayStatus,
  withdrawClubReapplication,
} from "../services/clubReapplications";
import { getClubAnnualState, getClubById } from "../services/clubs";
import { formatDate } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

const SECTION_PAGE_SIZE = 3;

function canWithdrawReapplication(request, annualStatus) {
  if (["SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED"].includes(request.status)) {
    return true;
  }
  return (
    request.status === "APPROVED" && annualStatus === "PENDING_SUPERVISOR"
  );
}

export function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [reapplications, setReapplications] = useState([]);
  const [annualByClubId, setAnnualByClubId] = useState({});
  const [clubSlugs, setClubSlugs] = useState({});
  const [missingClubs, setMissingClubs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [visibleApps, setVisibleApps] = useState(SECTION_PAGE_SIZE);
  const [visibleReapps, setVisibleReapps] = useState(SECTION_PAGE_SIZE);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [data, reapps] = await Promise.all([
        getMyClubRequests(user.id),
        getMyClubReapplications(user.id).catch(() => []),
      ]);
      setRequests(data);
      setReapplications(reapps);
      setVisibleApps(SECTION_PAGE_SIZE);
      setVisibleReapps(SECTION_PAGE_SIZE);

      const annualEntries = await Promise.all(
        reapps
          .filter((row) => row.club_id && row.status === "APPROVED")
          .map(async (row) => {
            try {
              const annual = await getClubAnnualState(row.club_id);
              return [row.club_id, annual?.status ?? null];
            } catch {
              return [row.club_id, null];
            }
          }),
      );
      setAnnualByClubId(Object.fromEntries(annualEntries));

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
      setError(getErrorMessage(loadError, "Could not load your requests."));
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional async page fetch
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

  const hasAny = requests.length > 0 || reapplications.length > 0;
  const visibleRequests = requests.slice(0, visibleApps);
  const visibleReapplications = reapplications.slice(0, visibleReapps);
  const hasMoreApps = visibleApps < requests.length;
  const hasMoreReapps = visibleReapps < reapplications.length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Your applications</p>
          <h1>My requests</h1>
          <p className="lede">
            Track new club applications and re-applications you have submitted.
          </p>
        </div>
        <div className="button-row">
          <Link className="button button--secondary" to="/clubs/apply">
            Apply for a new club
          </Link>
          <Link className="button button--secondary" to="/clubs/reapply">
            Re-apply an existing club
          </Link>
        </div>
      </header>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}

      {!error && !hasAny ? (
        <EmptyState title="No requests yet">
          Submitted club applications and re-applications will appear here.
        </EmptyState>
      ) : null}

      {requests.length > 0 ? (
        <section className="stack">
          <h2>New club applications</h2>
          {visibleRequests.map((request) => {
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
          {hasMoreApps ? (
            <div className="button-row">
              <button
                type="button"
                className="button button--secondary"
                onClick={() =>
                  setVisibleApps((current) => current + SECTION_PAGE_SIZE)
                }
              >
                View more
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {reapplications.length > 0 ? (
        <section className="stack">
          <h2>Club re-applications</h2>
          {visibleReapplications.map((request) => {
            const annualStatus = annualByClubId[request.club_id] || null;
            const displayStatus = getReapplicationDisplayStatus(
              request,
              annualStatus,
            );
            const canWithdraw = canWithdrawReapplication(request, annualStatus);
            const isBusy = busyId === request.id;
            const showManage =
              request.clubs?.slug &&
              request.status === "APPROVED" &&
              (annualStatus === "PENDING_SUPERVISOR" ||
                annualStatus === "ACTIVE");

            return (
              <article key={request.id} className="panel">
                <div className="section-heading">
                  <div>
                    <span className="submission-type">Re-application</span>
                    <h3>{request.clubs?.name || "Past club"}</h3>
                    <StatusBadge status={displayStatus} />
                  </div>
                  {showManage ? (
                    <Link
                      className="text-link"
                      to={`/clubs/${request.clubs.slug}/manage`}
                    >
                      Manage club
                    </Link>
                  ) : null}
                </div>
                <p className="muted">
                  {request.school_year} · Submitted{" "}
                  {formatDate(request.submitted_at)} · {request.applicant_email}
                </p>
                {request.review_notes ? (
                  <p>
                    <strong>Review notes:</strong> {request.review_notes}
                  </p>
                ) : null}
                {request.status === "CHANGES_REQUESTED" ? (
                  <p>
                    <Link to={`/clubs/reapply?edit=${request.id}`}>
                      Edit and resubmit
                    </Link>
                  </p>
                ) : null}
                {request.status === "REJECTED" || request.status === "WITHDRAWN" ? (
                  <p>
                    <Link to="/clubs/reapply">Create a new re-application</Link>{" "}
                    (subject to one application per Toronto calendar day).
                  </p>
                ) : null}
                {canWithdraw ? (
                  <div className="button-row">
                    <button
                      type="button"
                      className="button button--secondary"
                      disabled={isBusy}
                      onClick={() => setWithdrawTarget(request)}
                    >
                      {isBusy ? <Spinner size="sm" label="Working" /> : null}
                      Withdraw
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
          {hasMoreReapps ? (
            <div className="button-row">
              <button
                type="button"
                className="button button--secondary"
                onClick={() =>
                  setVisibleReapps((current) => current + SECTION_PAGE_SIZE)
                }
              >
                View more
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <ConfirmDialog
        open={Boolean(withdrawTarget)}
        title="Withdraw re-application?"
        confirmLabel="Withdraw"
        destructive
        busy={busyId === withdrawTarget?.id}
        onCancel={() => setWithdrawTarget(null)}
        onConfirm={() => {
          const target = withdrawTarget;
          if (!target) return;
          setWithdrawTarget(null);
          runAction(target.id, () => withdrawClubReapplication(target.id));
        }}
      >
        <p>
          This will cancel this club application and return the club to inactive
          status. The club history will remain and students may apply again in
          the future.
        </p>
      </ConfirmDialog>
    </div>
  );
}
