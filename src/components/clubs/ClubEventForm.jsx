import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ErrorMessage } from "../ui/ErrorMessage";
import { FilePicker } from "../ui/FilePicker";
import { LocalFilePreview } from "../ui/LocalFilePreview";
import { Spinner } from "../ui/Spinner";
import { TextArea } from "../ui/TextArea";
import { TextInput } from "../ui/TextInput";
import {
  deleteClubEventPhoto,
  submitClubEventRequest,
  uploadClubEventPhoto,
  validateClubEventPhoto,
} from "../../services/clubEvents";
import { validateClubEventForm } from "../../utils/clubEvents";
import { getTorontoTodayYmd } from "../../utils/torontoDate";
import { getErrorMessage } from "../../utils/errors";

export function ClubEventForm({ club, canSubmit = true }) {
  const { user } = useAuth();
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [requestedMaterials, setRequestedMaterials] = useState("");
  const [photo, setPhoto] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [photoError, setPhotoError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [success, setSuccess] = useState(false);

  function handlePhotoChange(file) {
    const nextError = validateClubEventPhoto(file);
    setPhotoError(nextError || "");
    if (!nextError) setPhoto(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || !canSubmit || !club) return;

    const validation = validateClubEventForm({
      eventName,
      eventDescription,
      eventStartDate,
      eventEndDate,
      requestedMaterials,
    });
    setFieldErrors(validation.errors);
    setError("");

    if (!validation.isValid || photoError) {
      setError("Please fix the highlighted fields before submitting.");
      return;
    }

    const requestId = crypto.randomUUID();
    let photoPath = null;
    setSubmitting(true);

    try {
      if (photo) {
        setUploadProgress("Uploading event photo…");
        photoPath = await uploadClubEventPhoto({
          userId: user.id,
          requestId,
          file: photo,
        });
      }

      setUploadProgress("Submitting event proposal…");
      await submitClubEventRequest({
        requestId,
        clubId: club.id,
        eventName: validation.data.eventName,
        eventDescription: validation.data.eventDescription,
        eventStartDate: validation.data.eventStartDate,
        eventEndDate: validation.data.eventEndDate,
        requestedMaterials: validation.data.requestedMaterials,
        photoStoragePath: photoPath,
      });

      setSuccess(true);
      setFieldErrors({});
    } catch (submitError) {
      if (photoPath) await deleteClubEventPhoto(photoPath);
      setError(
        getErrorMessage(submitError, "Could not submit the event proposal."),
      );
    } finally {
      setUploadProgress("");
      setSubmitting(false);
    }
  }

  if (!canSubmit) {
    return (
      <p className="muted">
        Only active club owners can submit event proposals.
      </p>
    );
  }

  if (success) {
    return (
      <div className="alert alert--success" role="status">
        <strong>Event proposal submitted</strong>
        <p>
          Your proposal for {club.name} was submitted for review.
        </p>
        <Link className="text-link" to="/my-requests/events">
          View my event proposals
        </Link>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={handleSubmit} noValidate>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <section className="panel form-stack">
        <TextInput
          id={`event-club-name-${club.id}`}
          label="Name of club"
          value={club.name}
          disabled
        />
        <TextInput
          id={`event-name-${club.id}`}
          label="Name of event"
          value={eventName}
          onChange={(event) => setEventName(event.target.value)}
          error={fieldErrors.eventName}
          required
          disabled={submitting}
        />
        <TextArea
          id={`event-description-${club.id}`}
          label="Detailed description of the event"
          value={eventDescription}
          onChange={(event) => setEventDescription(event.target.value)}
          error={fieldErrors.eventDescription}
          hint="Include what the event is and where you would like it to be held."
          rows={7}
          required
          disabled={submitting}
        />
        <TextInput
          id={`event-start-date-${club.id}`}
          label="Start date"
          type="date"
          value={eventStartDate}
          onChange={(event) => setEventStartDate(event.target.value)}
          error={fieldErrors.eventStartDate}
          min={getTorontoTodayYmd()}
          required
          disabled={submitting}
        />
        <TextInput
          id={`event-end-date-${club.id}`}
          label="End date"
          type="date"
          value={eventEndDate}
          onChange={(event) => setEventEndDate(event.target.value)}
          error={fieldErrors.eventEndDate}
          min={eventStartDate || getTorontoTodayYmd()}
          required
          disabled={submitting}
        />
        <TextArea
          id={`event-materials-${club.id}`}
          label="What SAC/school material will you be using?"
          value={requestedMaterials}
          onChange={(event) => setRequestedMaterials(event.target.value)}
          error={fieldErrors.requestedMaterials}
          hint="For example: tables, chairs, or other school equipment."
          rows={4}
          required
          disabled={submitting}
        />
        <FilePicker
          id={`event-photo-${club.id}`}
          label="Event photo"
          accept="image/jpeg,image/png,image/webp"
          files={photo}
          buttonLabel="Choose photo"
          emptyLabel="No photo chosen"
          hint="Optional. JPEG, PNG, or WebP up to 10 MB."
          error={photoError}
          disabled={submitting}
          onChange={handlePhotoChange}
        />
        {photo ? (
          <LocalFilePreview
            file={photo}
            alt="Selected event photo"
            disabled={submitting}
            removeLabel="Remove photo"
            onRemove={() => {
              setPhoto(null);
              setPhotoError("");
            }}
          />
        ) : null}
      </section>

      {uploadProgress ? <p className="form-hint">{uploadProgress}</p> : null}
      <div className="button-row">
        <button
          type="submit"
          className="button button--primary"
          disabled={submitting}
        >
          {submitting ? <Spinner size="sm" label="Submitting" /> : null}
          Submit event proposal
        </button>
      </div>
    </form>
  );
}
