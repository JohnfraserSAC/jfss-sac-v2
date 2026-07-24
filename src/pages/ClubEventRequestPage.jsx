import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ClubLiaisonContacts } from "../components/ClubApplicationShared";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { TextArea, TextInput } from "../components/FormField";
import { Spinner } from "../components/Spinner";
import { CLUB_APPLICATION_SCHOOL_YEAR } from "../config/clubApplications";
import { getClubBySlug } from "../services/clubs";
import { submitClubEventRequest } from "../services/clubEventRequests";
import { getCurrentUserClubMembership } from "../services/memberships";
import { isClubLeader } from "../utils/clubPermissions";
import { getErrorMessage } from "../utils/errors";

export function ClubEventRequestPage() {
  const { slug } = useParams();
  const { user, profile } = useAuth();
  const [club, setClub] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [clubEmail, setClubEmail] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [requestedMaterials, setRequestedMaterials] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setUnauthorized(false);
    try {
      const nextClub = await getClubBySlug(slug);
      if (!nextClub) {
        setClub(null);
        return;
      }
      setClub(nextClub);
      setClubEmail(nextClub.contact_email || "");
      const nextMembership = await getCurrentUserClubMembership(
        nextClub.id,
        user.id,
      );
      setMembership(nextMembership);
      if (
        nextMembership?.status !== "ACTIVE" ||
        !isClubLeader(nextMembership.role)
      ) {
        setUnauthorized(true);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load this club."));
    } finally {
      setLoading(false);
    }
  }, [slug, user.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || !club) return;

    const errors = {};
    if (!clubEmail.trim()) errors.clubEmail = "Club email is required.";
    if (!eventName.trim()) errors.eventName = "Event name is required.";
    if (eventDetails.trim().length < 10) {
      errors.eventDetails = "Provide a detailed event description.";
    }
    if (!requestedMaterials.trim()) {
      errors.requestedMaterials = "Describe the materials you need.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted fields before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessId(null);

    try {
      const id = await submitClubEventRequest({
        clubId: club.id,
        clubEmail,
        eventName,
        eventDetails,
        requestedMaterials,
        schoolYear: CLUB_APPLICATION_SCHOOL_YEAR,
      });
      setSuccessId(id);
      setEventName("");
      setEventDetails("");
      setRequestedMaterials("");
    } catch (submitError) {
      setError(
        getErrorMessage(submitError, "Could not submit the event request."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading event form…" />;
  }

  if (unauthorized && club) {
    return <Navigate to={`/clubs/${club.slug}/manage`} replace />;
  }

  if (!club) {
    return (
      <div className="page">
        <ErrorMessage>Club not found.</ErrorMessage>
      </div>
    );
  }

  return (
    <div className="page narrow-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{club.name}</p>
          <h1>Event Approval Form 2026–2027</h1>
          <p className="lede">
            Hey Jags, are you interested in planning an event for your club?
            Complete the form below to submit your event proposal for review and
            potential approval.
          </p>
        </div>
        <Link className="text-link" to={`/clubs/${club.slug}/manage`}>
          Back to manage
        </Link>
      </header>

      <section className="panel">
        <p>
          Submitting this form does not guarantee that the event will be
          approved. Your event must be approved before you submit a Club Funding
          Request Form. Provide as much detail as possible to help SAC review
          the proposal efficiently.
        </p>
        <p className="muted">
          Submitting as{" "}
          <strong>{profile?.email || user.email}</strong> for{" "}
          <strong>{club.name}</strong>.
        </p>
      </section>

      <ClubLiaisonContacts />

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {successId ? (
        <div className="alert alert--success" role="status">
          <strong>Event request submitted</strong>
          <p>
            Your event proposal was submitted.{" "}
            <Link className="text-link" to="/my-requests">
              View my requests
            </Link>
          </p>
        </div>
      ) : null}

      <form className="panel form-stack" onSubmit={handleSubmit} noValidate>
        <TextInput
          id="club_name"
          label="Name of club"
          value={club.name}
          disabled
        />
        <TextInput
          id="club_email"
          label="Club email"
          type="email"
          value={clubEmail}
          onChange={(event) => setClubEmail(event.target.value)}
          error={fieldErrors.clubEmail}
          required
          disabled={submitting}
        />
        <TextInput
          id="event_name"
          label="Name of event"
          value={eventName}
          onChange={(event) => setEventName(event.target.value)}
          error={fieldErrors.eventName}
          required
          disabled={submitting}
        />
        <TextArea
          id="event_details"
          label="Provide a detailed description of the event, including what it is, when it will take place, and where you would like it to be held."
          value={eventDetails}
          onChange={(event) => setEventDetails(event.target.value)}
          error={fieldErrors.eventDetails}
          rows={6}
          required
          disabled={submitting}
        />
        <TextArea
          id="requested_materials"
          label="What SAC or school materials will you be using for the event, such as tables or chairs?"
          value={requestedMaterials}
          onChange={(event) => setRequestedMaterials(event.target.value)}
          error={fieldErrors.requestedMaterials}
          rows={4}
          required
          disabled={submitting}
        />
        <button
          type="submit"
          className="button button--primary"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Spinner size="sm" label="Submitting" /> Submitting…
            </>
          ) : (
            "Submit event for approval"
          )}
        </button>
      </form>
    </div>
  );
}
