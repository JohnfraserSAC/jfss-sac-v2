import { useEffect, useRef, useState } from "react";
import { AnnouncementForm } from "../announcements/AnnouncementForm";
import { ErrorMessage } from "../ui/ErrorMessage";
import { createAnnouncement } from "../../services/announcements";
import {
  canPublishDirectly,
  validateAnnouncementForm,
} from "../../utils/announcementPermissions";
import { isClubOwner } from "../../utils/clubPermissions";
import { getErrorMessage } from "../../utils/errors";

const EMPTY_ANNOUNCEMENT = {
  title: "",
  summary: "",
  body: "",
  clubId: "",
  visibility: "PUBLIC",
  scheduledPostingDate: "",
};

export function ClubAnnouncementsPanel({
  club,
  membership,
  annual,
  isSacAdmin = false,
  isFacultyAdvisor = false,
}) {
  const operationsAllowed = annual?.status === "ACTIVE";
  const isOwner =
    isClubOwner(membership?.role) && membership?.status === "ACTIVE";
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
  const successRef = useRef(null);

  useEffect(() => {
    if (!success || !successRef.current) return;

    const notification = successRef.current;
    const top =
      window.scrollY + notification.getBoundingClientRect().top - 112;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [success]);

  const actions = [
    { value: "SUBMIT", label: "Submit for Review", primary: true },
  ];

  async function handleSubmitAction(action) {
    if (submittingAction) return;
    if (!operationsAllowed && !isStaff) {
      setError(
        "Announcements unlock after the club is ACTIVE for the school year.",
      );
      return;
    }

    const validation = validateAnnouncementForm(
      { ...values, clubId: club.id },
      { requireClub: true, requirePostingDate: action === "SUBMIT" },
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
        { ...validation.data, clubId: club.id, requireClub: true },
        action,
      );
      setValues({
        ...EMPTY_ANNOUNCEMENT,
        clubId: club.id,
        clubName: club.name,
      });
      setSuccess(
        action === "SUBMIT"
          ? "Announcement submitted for review. It will post on the scheduled Toronto date once approved."
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
      id="manage-panel-announcements"
      role="tabpanel"
      aria-labelledby="manage-tab-announcements"
      className="stack"
    >
      <section className="panel">
        <h2>Announcement request</h2>
        <p className="muted">
          Use announcements for club news and events. Every request needs a
          Toronto posting date. Choose today to request publish now once
          approved, or a future date to schedule midnight go-live.
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
              <div
                ref={successRef}
                className="alert alert--success manage-announcement-success"
                role="status"
              >
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
    </div>
  );
}
