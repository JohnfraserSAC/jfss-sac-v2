import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AttachmentPreview } from "../components/AttachmentPreview";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { PermissionNotice } from "../components/PermissionNotice";
import { Select, TextArea, TextInput } from "../components/FormField";
import { StatusBadge } from "../components/StatusBadge";
import {
  approveClubRequest,
  getAdminClubRequestQueue,
  updateClubRequestReview,
} from "../services/clubRequests";
import { createSignedClubDocumentUrl } from "../services/clubDocuments";
import { getClubById } from "../services/clubs";
import { formatDate } from "../utils/format";
import { getErrorMessage } from "../utils/errors";
import { slugifyClubName } from "../utils/slug";
import { validateClubSlug } from "../utils/validation";

export function AdminClubRequestsPage({ embedded = false }) {
  const { canMutateReviews, isSacAdmin } = useAuth();
  const readOnly = !canMutateReviews;
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [notesById, setNotesById] = useState({});
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [approveSlug, setApproveSlug] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [approveSlugError, setApproveSlugError] = useState("");
  const [approving, setApproving] = useState(false);
  const [createdClubLink, setCreatedClubLink] = useState(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAdminClubRequestQueue({
        status: statusFilter,
        search,
      });
      setRequests(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load the request queue."));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      loadQueue();
    }, 250);

    return () => window.clearTimeout(handle);
  }, [loadQueue]);

  function setNotes(requestId, value) {
    setNotesById((current) => ({ ...current, [requestId]: value }));
  }

  async function runReviewAction(request, status, requireNotes) {
    if (readOnly) return false;

    const notes = (notesById[request.id] || "").trim();

    if (requireNotes && !notes) {
      setActionError("Review notes are required for this action.");
      return false;
    }

    setBusyId(request.id);
    setActionError("");
    setActionSuccess("");
    setCreatedClubLink(null);

    try {
      await updateClubRequestReview({
        requestId: request.id,
        status,
        reviewNotes: requireNotes ? notes : notes || undefined,
      });
      setActionSuccess(`Updated ${request.proposed_name} to ${status}.`);
      await loadQueue();
      return true;
    } catch (actionErr) {
      setActionError(
        getErrorMessage(actionErr, "Could not update the request."),
      );
      return false;
    } finally {
      setBusyId(null);
    }
  }

  function openApproveDialog(request) {
    if (readOnly) return;
    setApproveTarget(request);
    setApproveSlug(slugifyClubName(request.proposed_name));
    setApproveNotes(notesById[request.id] || "");
    setApproveSlugError("");
    setActionError("");
  }

  function closeApproveDialog() {
    if (approving) return;
    setApproveTarget(null);
    setApproveSlug("");
    setApproveNotes("");
    setApproveSlugError("");
  }

  async function confirmApprove() {
    if (!approveTarget || readOnly) return;

    const slugError = validateClubSlug(approveSlug);
    if (slugError) {
      setApproveSlugError(slugError);
      return;
    }

    setApproving(true);
    setApproveSlugError("");
    setActionError("");
    setActionSuccess("");
    setCreatedClubLink(null);

    try {
      const clubId = await approveClubRequest({
        requestId: approveTarget.id,
        slug: approveSlug,
        reviewNotes: approveNotes.trim() || null,
      });

      let clubSlug = approveSlug.trim().toLowerCase();
      try {
        const club = await getClubById(clubId);
        if (club?.slug) clubSlug = club.slug;
      } catch {
        // Keep generated slug if the follow-up read fails.
      }

      setCreatedClubLink({
        id: clubId,
        slug: clubSlug,
        name: approveTarget.proposed_name,
      });
      setActionSuccess(
        `${approveTarget.proposed_name} was approved and is now public on Explore.`,
      );
      setApproveTarget(null);
      await loadQueue();
    } catch (approveErr) {
      const message = getErrorMessage(
        approveErr,
        "Could not approve this club request.",
      );
      setApproveSlugError(message);
      setActionError(message);
    } finally {
      setApproving(false);
    }
  }

  if (loading && requests.length === 0) {
    return <LoadingScreen message="Loading club request queue…" />;
  }

  return (
    <div className={embedded ? "exec-section" : "page"}>
      {!embedded ? (
        <header className="page-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Club request queue</h1>
            <p className="lede">
              Review submitted club registration requests.
            </p>
          </div>
        </header>
      ) : (
        <h2 className="exec-section__title">New Club Applications</h2>
      )}

      {readOnly ? (
        <PermissionNotice title="Read only">
          You can view club registration requests, but you cannot approve,
          reject, or request changes.
        </PermissionNotice>
      ) : null}

      <div className="toolbar toolbar--split">
        <Select
          id="status-filter"
          label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">Pending queue</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="CHANGES_REQUESTED">Changes requested</option>
        </Select>

        <TextInput
          id="queue-search"
          label="Search by proposed name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search club name"
        />
      </div>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}

      {actionSuccess ? (
        <div className="alert alert--success" role="status">
          <strong>Success</strong>
          <p>{actionSuccess}</p>
          {createdClubLink ? (
            <p>
              <Link
                className="text-link"
                to={`/clubs/${createdClubLink.slug}`}
              >
                View {createdClubLink.name}
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      {!error && requests.length === 0 ? (
        <EmptyState title="Queue is empty">
          There are no club registration requests matching this filter.
        </EmptyState>
      ) : (
        <div className="stack">
          {requests.map((request) => {
            const isBusy = busyId === request.id;

            return (
              <article key={request.id} className="panel admin-request-card">
                <div className="section-heading">
                  <div>
                    <h2>{request.proposed_name}</h2>
                    <StatusBadge status={request.status} />
                  </div>
                </div>

                <dl className="meta-list">
                  <div>
                    <dt>Request ID</dt>
                    <dd>
                      <code>{request.id}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Requested by</dt>
                    <dd>
                      <code>{request.requested_by}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>
                      {formatDate(request.submitted_at || request.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt>Expected members</dt>
                    <dd>{request.expected_member_count ?? "Not provided"}</dd>
                  </div>
                  <div>
                    <dt>Applicant email</dt>
                    <dd>{request.respondent_email || "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt>Advisor</dt>
                    <dd>
                      {request.faculty_advisor_name || "Not provided"}
                      {request.faculty_advisor_email
                        ? ` · ${request.faculty_advisor_email}`
                        : ""}
                    </dd>
                  </div>
                </dl>

                <div className="admin-request-card__details">
                  {request.short_description ? (
                    <p>
                      <strong>Short description:</strong>{" "}
                      {request.short_description}
                    </p>
                  ) : null}
                  <p>
                    <strong>Description:</strong> {request.description}
                  </p>
                  {request.student_benefit ? (
                    <p>
                      <strong>Student benefit:</strong>{" "}
                      {request.student_benefit}
                    </p>
                  ) : null}
                  <p>
                    <strong>Purpose:</strong> {request.purpose}
                  </p>
                  {request.leader_details ? (
                    <p>
                      <strong>Leaders:</strong> {request.leader_details}
                    </p>
                  ) : null}
                  {request.club_contact_information ? (
                    <p>
                      <strong>Club contact:</strong>{" "}
                      {request.club_contact_information}
                    </p>
                  ) : null}
                  {(request.teacher_supervisor_emails || []).length > 0 ? (
                    <p>
                      <strong>Teacher supervisors:</strong>{" "}
                      {request.teacher_supervisor_emails.join(", ")}
                    </p>
                  ) : null}
                  {request.potential_event_ideas ? (
                    <p>
                      <strong>Event ideas:</strong>{" "}
                      {request.potential_event_ideas}
                    </p>
                  ) : null}
                  {request.meeting_plan ? (
                    <p>
                      <strong>Meeting plan:</strong> {request.meeting_plan}
                    </p>
                  ) : null}
                  {request.constitution_url ? (
                    <p>
                      <strong>Constitution:</strong>{" "}
                      <a
                        className="text-link"
                        href={request.constitution_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open link
                      </a>
                    </p>
                  ) : null}
                  {request.review_notes ? (
                    <p>
                      <strong>Current review notes:</strong>{" "}
                      {request.review_notes}
                    </p>
                  ) : null}
                </div>

                {isSacAdmin && request.teacher_supervisor_form_storage_path ? (
                  <AttachmentPreview
                    path={request.teacher_supervisor_form_storage_path}
                    getSignedUrl={createSignedClubDocumentUrl}
                    mimeType="image/jpeg"
                    filename="signed-teacher-supervisor-form"
                    alt="Signed teacher supervisor form"
                  />
                ) : null}

                {!readOnly ? (
                  <>
                    <TextArea
                      id={`notes-${request.id}`}
                      label="Review notes"
                      value={notesById[request.id] || ""}
                      onChange={(event) =>
                        setNotes(request.id, event.target.value)
                      }
                      rows={3}
                      hint="Required when rejecting. Optional when approving."
                    />

                    <div className="button-row">
                      <button
                        type="button"
                        className="button button--danger"
                        disabled={isBusy}
                        onClick={() => {
                          if (!(notesById[request.id] || "").trim()) {
                            setActionError(
                              "Review notes are required when rejecting.",
                            );
                            return;
                          }
                          setRejectTarget(request);
                        }}
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        className="button button--primary"
                        disabled={
                          isBusy ||
                          !["SUBMITTED", "UNDER_REVIEW"].includes(
                            request.status,
                          )
                        }
                        onClick={() => openApproveDialog(request)}
                      >
                        Approve
                      </button>
                    </div>
                  </>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(approveTarget)}
        title="Approve club request"
        confirmLabel="Approve and create club"
        onCancel={closeApproveDialog}
        onConfirm={confirmApprove}
        busy={approving}
        confirmDisabled={!approveSlug.trim()}
      >
        <p>
          This will create the club, assign the requester as OWNER, and mark the
          request as approved in one server transaction.
        </p>

        <TextInput
          id="approve-slug"
          label="Club slug"
          value={approveSlug}
          onChange={(event) => setApproveSlug(event.target.value)}
          error={approveSlugError}
          required
        />

        <TextArea
          id="approve-notes"
          label="Review notes"
          value={approveNotes}
          onChange={(event) => setApproveNotes(event.target.value)}
          rows={3}
          hint="Optional"
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        title="Reject club request?"
        confirmLabel="Reject"
        destructive
        busy={busyId === rejectTarget?.id}
        confirmDisabled={
          !((notesById[rejectTarget?.id] || "").trim())
        }
        onCancel={() => {
          if (busyId) return;
          setRejectTarget(null);
        }}
        onConfirm={async () => {
          if (!rejectTarget) return;
          const ok = await runReviewAction(rejectTarget, "REJECTED", true);
          if (ok) setRejectTarget(null);
        }}
      >
        <p>
          Reject <strong>{rejectTarget?.proposed_name}</strong>? Review notes
          are required.
        </p>
      </ConfirmDialog>
    </div>
  );
}
