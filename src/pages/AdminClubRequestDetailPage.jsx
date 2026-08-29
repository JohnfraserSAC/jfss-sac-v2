import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AttachmentPreview } from "../components/ui/AttachmentPreview";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { PermissionNotice } from "../components/ui/PermissionNotice";
import { TextArea } from "../components/ui/TextArea";
import { TextInput } from "../components/ui/TextInput";
import { StatusBadge } from "../components/ui/StatusBadge";
import {
  approveClubRequest,
  getAdminClubRequestById,
  updateClubRequestReview,
} from "../services/clubRequests";
import { createSignedClubDocumentUrl } from "../services/clubDocuments";
import { getClubById } from "../services/clubs";
import { resolveClubLogoUrl } from "../utils/clubMedia";
import { formatDate } from "../utils/format";
import { getErrorMessage } from "../utils/errors";
import { slugifyClubName } from "../utils/slug";
import { validateClubSlug } from "../utils/validation";

export function AdminClubRequestDetailPage({ embedded = false }) {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { canMutateReviews, isSacAdmin } = useAuth();
  const readOnly = !canMutateReviews;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveSlug, setApproveSlug] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [approveSlugError, setApproveSlugError] = useState("");
  const [approving, setApproving] = useState(false);

  const listPath = "/exec-dashboard/applications/new";

  const loadRequest = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAdminClubRequestById(requestId);
      if (!data) {
        setError("This club request could not be found.");
        setRequest(null);
        return;
      }
      setRequest(data);
      setReviewNotes(data.review_notes || "");
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load this club request."));
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load request data on mount
    loadRequest();
  }, [loadRequest]);

  function openApproveDialog() {
    if (readOnly || !request) return;
    setApproveSlug(slugifyClubName(request.proposed_name));
    setApproveNotes(reviewNotes);
    setApproveSlugError("");
    setActionError("");
    setApproveOpen(true);
  }

  function closeApproveDialog() {
    if (approving) return;
    setApproveOpen(false);
    setApproveSlug("");
    setApproveNotes("");
    setApproveSlugError("");
  }

  async function confirmApprove() {
    if (!request || readOnly) return;

    const slugError = validateClubSlug(approveSlug);
    if (slugError) {
      setApproveSlugError(slugError);
      return;
    }

    setApproving(true);
    setApproveSlugError("");
    setActionError("");

    try {
      const clubId = await approveClubRequest({
        requestId: request.id,
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

      navigate(listPath, {
        state: {
          success: `${request.proposed_name} was approved and is now public on Explore.`,
          createdClub: {
            slug: clubSlug,
            name: request.proposed_name,
          },
        },
      });
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

  async function confirmReject() {
    if (!request || readOnly) return;

    const notes = reviewNotes.trim();
    if (!notes) {
      setActionError("Review notes are required when rejecting.");
      return;
    }

    setBusy(true);
    setActionError("");

    try {
      await updateClubRequestReview({
        requestId: request.id,
        status: "REJECTED",
        reviewNotes: notes,
      });
      navigate(listPath, {
        state: {
          success: `Updated ${request.proposed_name} to REJECTED.`,
        },
      });
    } catch (actionErr) {
      setActionError(
        getErrorMessage(actionErr, "Could not update the request."),
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading club request…" />;
  }

  if (error && !request) {
    return (
      <div className={embedded ? "exec-section" : "page"}>
        <p>
          <Link className="text-link" to={listPath}>
            ← Back to new applications
          </Link>
        </p>
        <ErrorMessage>{error}</ErrorMessage>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const canReview =
    !readOnly && ["SUBMITTED", "UNDER_REVIEW"].includes(request.status);

  return (
    <div className={embedded ? "exec-section" : "page"}>
      <p className="exec-detail-back">
        <Link className="text-link" to={listPath}>
          ← Back to new applications
        </Link>
      </p>

      <section className="admin-request-hero">
        <p className="admin-request-hero__eyebrow">Submitted</p>
        <div className="admin-request-hero__heading">
          <h2 className="exec-section__title">{request.proposed_name}</h2>
          <StatusBadge status={request.status} />
        </div>
        <div className="admin-request-hero__meta">
          <div>
            <span>Applicant</span>
            <strong>{request.respondent_email || "Not recorded"}</strong>
          </div>
          <span className="admin-request-hero__divider" aria-hidden="true" />
          <div>
            <span>Submitted</span>
            <strong>
              {formatDate(request.submitted_at || request.created_at)}
            </strong>
          </div>
        </div>
      </section>

      {readOnly ? (
        <PermissionNotice title="Read only">
          You can view club registration requests, but you cannot approve,
          reject, or request changes.
        </PermissionNotice>
      ) : null}

      {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}

      <article className="panel admin-request-card">
        <dl className="meta-list">
          <div>
            <dt>Request ID</dt>
            <dd>
              <code>{request.id}</code>
            </dd>
          </div>
          <div>
            <dt>Expected members</dt>
            <dd>{request.expected_member_count ?? "Not provided"}</dd>
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
          <p>
            <strong>Description:</strong> {request.description}
          </p>
          {request.student_benefit ? (
            <p>
              <strong>Student benefit:</strong> {request.student_benefit}
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
              <strong>Club contact:</strong> {request.club_contact_information}
            </p>
          ) : null}
          {request.instagram_handle ? (
            <p>
              <strong>Instagram:</strong> {request.instagram_handle}
            </p>
          ) : null}
          {request.meeting_days?.length ? (
            <p>
              <strong>Meeting days:</strong>{" "}
              {request.meeting_days.join(", ")}
            </p>
          ) : null}
          {request.meeting_time_details ? (
            <p>
              <strong>Meeting time / details:</strong>{" "}
              {request.meeting_time_details}
            </p>
          ) : null}
          {request.meeting_location ? (
            <p>
              <strong>Meeting location:</strong> {request.meeting_location}
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
              <strong>Event ideas:</strong> {request.potential_event_ideas}
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
              <strong>Current review notes:</strong> {request.review_notes}
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
        {request.logo_storage_path ? (
          <div className="signed-form-preview">
            <p className="muted">Proposed club logo</p>
            <img
              src={resolveClubLogoUrl(request.logo_storage_path)}
              alt="Proposed club logo"
              className="logo-preview"
            />
          </div>
        ) : null}

        {canReview ? (
          <div className="admin-request-review">
            <TextArea
              id="review-notes"
              label="Review notes"
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              rows={3}
              hint="Required when rejecting. Optional when approving."
            />

            <div className="button-row">
              <button
                type="button"
                className="button button--danger"
                disabled={busy || approving}
                onClick={() => {
                  if (!reviewNotes.trim()) {
                    setActionError(
                      "Review notes are required when rejecting.",
                    );
                    return;
                  }
                  setRejectOpen(true);
                }}
              >
                Reject
              </button>

              <button
                type="button"
                className="button button--primary"
                disabled={busy || approving}
                onClick={openApproveDialog}
              >
                Approve
              </button>
            </div>
          </div>
        ) : null}
      </article>

      <ConfirmDialog
        open={approveOpen}
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
        open={rejectOpen}
        title="Reject club request?"
        confirmLabel="Reject"
        destructive
        busy={busy}
        confirmDisabled={!reviewNotes.trim()}
        onCancel={() => {
          if (busy) return;
          setRejectOpen(false);
        }}
        onConfirm={async () => {
          await confirmReject();
          setRejectOpen(false);
        }}
      >
        <p>
          Reject <strong>{request.proposed_name}</strong>? Review notes are
          required.
        </p>
      </ConfirmDialog>
    </div>
  );
}
