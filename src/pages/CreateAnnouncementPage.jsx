import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AnnouncementForm } from "../components/announcements/AnnouncementForm";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import {
  createAnnouncement,
  getApprovedClubsForStaffAnnouncements,
} from "../services/announcements";
import {
  canPublishDirectly,
  validateAnnouncementForm,
} from "../utils/announcementPermissions";
import { getErrorMessage } from "../utils/errors";

const EMPTY_VALUES = {
  title: "",
  summary: "",
  body: "",
  imageUrl: "",
  clubId: "",
  scheduledPostingDate: "",
};

export function CreateAnnouncementPage() {
  const navigate = useNavigate();
  const {
    user,
    isSacAdmin,
    isFacultyAdvisor,
    ownedClubs,
    canCreateAnnouncements,
    refreshOwnedClubs,
  } = useAuth();

  const isStaff = canPublishDirectly({
    isSacAdmin,
    isFacultyAdvisor,
  });

  const [values, setValues] = useState(EMPTY_VALUES);
  const [staffClubs, setStaffClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submittingAction, setSubmittingAction] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        await refreshOwnedClubs(user.id);
        if (isStaff) {
          const clubs = await getApprovedClubsForStaffAnnouncements();
          if (!active) return;
          setStaffClubs(clubs);
        }
      } catch (loadError) {
        if (!active) return;
        setError(getErrorMessage(loadError, "Could not prepare the form."));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [user.id, isStaff, refreshOwnedClubs]);

  const clubs = isStaff ? staffClubs : ownedClubs;

  const actions = useMemo(
    () => [
      { value: "DRAFT", label: "Save Draft" },
      { value: "SUBMIT", label: "Submit for Review", primary: true },
    ],
    [],
  );

  if (!canCreateAnnouncements && !loading) {
    return <Navigate to="/announcements" replace />;
  }

  if (loading) {
    return <LoadingScreen message="Preparing announcement form…" />;
  }

  if (!isStaff && ownedClubs.length === 0) {
    return (
      <div className="page narrow-page">
        <ErrorMessage title="No owned clubs">
          You need to be an active owner of an approved club before you can
          create a club announcement.
        </ErrorMessage>
        <Link className="text-link" to="/clubs/my-clubs">
          Go to My Clubs
        </Link>
      </div>
    );
  }

  async function handleSubmitAction(action) {
    if (submittingAction) return;

    const ownerCreating = !isStaff;
    const staffCreatingClub = isStaff && Boolean(values.clubId);

    const validation = validateAnnouncementForm(values, {
      requireClub: ownerCreating || staffCreatingClub,
      requirePostingDate: action === "SUBMIT",
    });

    setFieldErrors(validation.errors);
    setError("");

    if (!validation.isValid) {
      setError("Please fix the highlighted fields before continuing.");
      return;
    }

    if (ownerCreating && !validation.data.clubId) {
      setError("Select a club for this announcement.");
      return;
    }

    setSubmittingAction(action);

    try {
      await createAnnouncement(
        {
          ...validation.data,
          requireClub: ownerCreating,
        },
        action,
      );

      navigate("/my-requests/announcements", {
        replace: true,
        state: {
          notice:
            action === "SUBMIT"
              ? "Announcement submitted for SAC review."
              : "Draft saved.",
        },
      });
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
    <div className="page narrow-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Create</p>
          <h1>New announcement</h1>
          <p className="lede">
            {isStaff
              ? "Create a general or club announcement draft, or submit it for review with a Toronto posting date."
              : "Create a club announcement as a draft or submit it for SAC review with a Toronto posting date."}
          </p>
        </div>
      </header>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <AnnouncementForm
        mode="create"
        values={values}
        onChange={setValues}
        fieldErrors={fieldErrors}
        clubs={clubs}
        showTypeSelector={isStaff}
        actions={actions}
        submittingAction={submittingAction}
        onSubmitAction={handleSubmitAction}
        error=""
      />
    </div>
  );
}
