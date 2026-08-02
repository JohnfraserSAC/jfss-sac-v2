import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnnouncementForm } from "./AnnouncementForm";
import { ErrorMessage } from "./ErrorMessage";
import { createAnnouncement } from "../services/announcements";
import {
  canPublishDirectly,
  validateAnnouncementForm,
} from "../utils/announcementPermissions";
import { isClubOwner, isClubLeader } from "../utils/clubPermissions";
import { getErrorMessage } from "../utils/errors";

const EMPTY_ANNOUNCEMENT = {
  title: "",
  summary: "",
  body: "",
  imageUrl: "",
  clubId: "",
  expiresAt: "",
};

export function ClubRequestsPanel({
  club,
  membership,
  annual,
  isSacAdmin = false,
  isFacultyAdvisor = false,
}) {
  const operationsAllowed = annual?.status === "ACTIVE";
  const isOwner =
    isClubOwner(membership?.role) && membership?.status === "ACTIVE";
  const isLeader =
    isClubLeader(membership?.role) && membership?.status === "ACTIVE";
  const isStaff = canPublishDirectly({ isSacAdmin, isFacultyAdvisor });
  const canCreateClubAnnouncement = isOwner || isStaff;

  const [values, setValues] = useState({
    ...EMPTY_ANNOUNCEMENT,
    clubId: club.id,
    clubName: club.name,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submittingAction, setSubmittingAction] = useState(null);

  const actions = useMemo(() => {
    if (isStaff) {
      return [
        { value: "DRAFT", label: "Save Draft" },
        { value: "PUBLISH", label: "Publish Now", primary: true },
      ];
    }
    return [
      { value: "DRAFT", label: "Save Draft" },
      { value: "SUBMIT", label: "Submit for Review", primary: true },
    ];
  }, [isStaff]);

  async function handleSubmitAction(action) {
    if (submittingAction) return;
    if (!operationsAllowed && !isStaff) {
      setError(
        "Announcements unlock after the club is ACTIVE for the school year.",
      );
      return;
    }

    const validation = validateAnnouncementForm(
      { ...values, clubId: club.id, requireClub: true },
      { requireClub: true },
    );

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setError(Object.values(validation.errors)[0] || "Check the form.");
      return;
    }

    setFieldErrors({});
    setError("");
    setSuccess("");
    setSubmittingAction(action);

    try {
      await createAnnouncement(
        { ...values, clubId: club.id, requireClub: true },
        action,
      );
      setValues({
        ...EMPTY_ANNOUNCEMENT,
        clubId: club.id,
        clubName: club.name,
      });
      setSuccess(
        action === "PUBLISH"
          ? "Announcement published."
          : action === "SUBMIT"
            ? "Announcement submitted for review. It is not published yet."
            : "Announcement draft saved.",
      );
    } catch (submitError) {
      if (submitError.fieldErrors) {
        setFieldErrors(submitError.fieldErrors);
      }
      setError(
        getErrorMessage(submitError, "Could not create the announcement."),
      );
    } finally {
      setSubmittingAction(null);
    }
  }

  return (
    <div
      id="manage-panel-requests"
      role="tabpanel"
      aria-labelledby="manage-tab-requests"
      className="stack"
    >
      <section className="panel">
        <h2>Announcement request</h2>
        <p className="muted">
          Use announcements for club news and events. Drafts and submissions
          follow the existing review flow. Club owners cannot publish directly.
        </p>

        {!operationsAllowed && !isStaff ? (
          <p className="muted">
            Announcement requests unlock after the club is ACTIVE.
          </p>
        ) : null}

        {canCreateClubAnnouncement && (operationsAllowed || isStaff) ? (
          <>
            {error ? <ErrorMessage>{error}</ErrorMessage> : null}
            {success ? (
              <div className="alert alert--success" role="status">
                <strong>Success</strong>
                <p>{success}</p>
              </div>
            ) : null}
            <AnnouncementForm
              mode="create"
              values={values}
              onChange={setValues}
              fieldErrors={fieldErrors}
              clubs={[club]}
              clubReadOnly
              actions={actions}
              submittingAction={submittingAction}
              onSubmitAction={handleSubmitAction}
              error=""
            />
          </>
        ) : (
          <p className="muted">
            Only club owners can draft and submit announcements for this club.
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Funding request</h2>
        <p>Club funding requests are coming soon.</p>
        {isLeader ? (
          <Link
            className="button button--secondary"
            to={`/clubs/${club.slug}/manage/funding`}
          >
            Open funding placeholder
          </Link>
        ) : null}
      </section>
    </div>
  );
}
