import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ClubLiaisonContacts,
  TeacherSupervisorFormSection,
} from "../components/ClubApplicationShared";
import { ClubsSubnav } from "../components/ClubsSubnav";
import { ErrorMessage } from "../components/ErrorMessage";
import { Select, TextArea, TextInput } from "../components/FormField";
import { SignedFormUpload } from "../components/SignedFormUpload";
import { Spinner } from "../components/Spinner";
import { CLUB_APPLICATION_SCHOOL_YEAR } from "../config/clubApplications";
import { getApprovedClubs } from "../services/clubs";
import {
  deleteClubApplicationDocument,
  uploadClubApplicationDocument,
} from "../services/clubDocuments";
import {
  submitClubReapplication,
  validateSupervisorEmails,
} from "../services/clubReapplications";
import { getErrorMessage } from "../utils/errors";

const INITIAL = {
  club_id: "",
  submitted_club_name: "",
  club_purpose: "",
  previous_year_leaders: "",
  current_year_leaders: "",
  new_leader_contact_information: "",
  club_contact_information: "",
  instagram_handle: "",
  teacher_supervisor_emails: "",
  is_seeking_teacher_supervisor: false,
};

export function ClubReapplyPage() {
  const { user, profile } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [values, setValues] = useState(INITIAL);
  const [file, setFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState(null);

  const respondentEmail = profile?.email || user?.email || "";

  useEffect(() => {
    let active = true;
    getApprovedClubs()
      .then((data) => {
        if (active) setClubs(data);
      })
      .catch(() => {
        if (active) setClubs([]);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleClubSelect(event) {
    const clubId = event.target.value;
    const club = clubs.find((item) => item.id === clubId);
    setValues((current) => ({
      ...current,
      club_id: clubId,
      submitted_club_name: club?.name || current.submitted_club_name,
    }));
  }

  function validate() {
    const errors = {};
    if (values.submitted_club_name.trim().length < 2) {
      errors.submitted_club_name = "Enter the club’s name.";
    }
    if (values.club_purpose.trim().length < 10) {
      errors.club_purpose = "Describe the club’s purpose.";
    }
    if (values.previous_year_leaders.trim().length < 3) {
      errors.previous_year_leaders = "List last year’s club leader(s).";
    }
    if (values.current_year_leaders.trim().length < 3) {
      errors.current_year_leaders = "List this year’s club leader(s).";
    }
    if (values.new_leader_contact_information.trim().length < 3) {
      errors.new_leader_contact_information =
        "Provide new leader contact information.";
    }
    if (values.club_contact_information.trim().length < 3) {
      errors.club_contact_information = "Provide the club’s contact information.";
    }
    if (values.instagram_handle.trim().length < 2) {
      errors.instagram_handle = "Provide the club’s Instagram handle.";
    }

    const supervisor = validateSupervisorEmails(
      values.teacher_supervisor_emails,
      { required: !values.is_seeking_teacher_supervisor },
    );
    if (supervisor.error) {
      errors.teacher_supervisor_emails = supervisor.error;
    }

    if (!file) {
      errors.signed_form = "Upload the signed Teacher Supervisor Form image.";
    }

    return { errors, emails: supervisor.emails };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setSuccessId(null);
    const { errors, emails } = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted fields before submitting.");
      return;
    }

    const requestId = crypto.randomUUID();
    let uploadedPath = null;
    setSubmitting(true);

    try {
      uploadedPath = await uploadClubApplicationDocument({
        folder: "club-reapplications",
        userId: user.id,
        submissionId: requestId,
        file,
      });

      await submitClubReapplication({
        requestId,
        clubId: values.club_id || null,
        submittedClubName: values.submitted_club_name,
        clubPurpose: values.club_purpose,
        previousYearLeaders: values.previous_year_leaders,
        currentYearLeaders: values.current_year_leaders,
        newLeaderContactInformation: values.new_leader_contact_information,
        clubContactInformation: values.club_contact_information,
        instagramHandle: values.instagram_handle,
        teacherSupervisorEmails: emails,
        isSeekingTeacherSupervisor: values.is_seeking_teacher_supervisor,
        teacherSupervisorFormStoragePath: uploadedPath,
        schoolYear: CLUB_APPLICATION_SCHOOL_YEAR,
      });

      setSuccessId(requestId);
      setValues(INITIAL);
      setFile(null);
      setFieldErrors({});
    } catch (submitError) {
      if (uploadedPath) {
        await deleteClubApplicationDocument(uploadedPath);
      }
      setError(
        getErrorMessage(submitError, "Could not submit the re-application."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page narrow-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Clubs · {CLUB_APPLICATION_SCHOOL_YEAR}</p>
          <h1>Club Re-Application Form 2026–2027</h1>
          <p className="lede">
            Hello Fraser Clubs! If you are an already established club at Fraser
            that will be returning this upcoming year, complete this form so
            your club can continue to be recognized as an official Fraser club
            and remain eligible for funding, events, and other club
            opportunities.
          </p>
        </div>
      </header>

      <ClubsSubnav />

      <section className="panel">
        <p className="muted">
          Submitting as <strong>{respondentEmail}</strong>. Your account email
          is recorded automatically.
        </p>
        <p className="muted">
          Selecting an existing club helps SAC review. Leadership changes are
          not applied automatically from this form.
        </p>
      </section>

      <ClubLiaisonContacts />
      <TeacherSupervisorFormSection />

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      {successId ? (
        <div className="alert alert--success" role="status">
          <strong>Re-application submitted</strong>
          <p>
            Your club re-application was submitted successfully.{" "}
            <Link className="text-link" to="/my-requests">
              View my requests
            </Link>
          </p>
        </div>
      ) : null}

      <form className="panel form-stack" onSubmit={handleSubmit} noValidate>
        <Select
          id="club_id"
          name="club_id"
          label="Link to an existing approved club (recommended)"
          value={values.club_id}
          onChange={handleClubSelect}
          disabled={submitting}
        >
          <option value="">Not linked / unsure</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </Select>

        <TextInput
          id="submitted_club_name"
          name="submitted_club_name"
          label="Club's Name"
          value={values.submitted_club_name}
          onChange={updateField}
          error={fieldErrors.submitted_club_name}
          required
          disabled={submitting}
        />

        <TextArea
          id="club_purpose"
          name="club_purpose"
          label="What is your club's purpose?"
          value={values.club_purpose}
          onChange={updateField}
          error={fieldErrors.club_purpose}
          rows={4}
          required
          disabled={submitting}
        />

        <TextArea
          id="previous_year_leaders"
          name="previous_year_leaders"
          label="Who was/were your club leader(s) last year?"
          value={values.previous_year_leaders}
          onChange={updateField}
          error={fieldErrors.previous_year_leaders}
          rows={3}
          required
          disabled={submitting}
        />

        <TextArea
          id="current_year_leaders"
          name="current_year_leaders"
          label="Who are/is going to be your club leader(s) this year?"
          value={values.current_year_leaders}
          onChange={updateField}
          error={fieldErrors.current_year_leaders}
          rows={3}
          required
          disabled={submitting}
        />

        <TextArea
          id="new_leader_contact_information"
          name="new_leader_contact_information"
          label="Please provide the new leader(s) contact information, such as Instagram, email, or phone number."
          value={values.new_leader_contact_information}
          onChange={updateField}
          error={fieldErrors.new_leader_contact_information}
          rows={3}
          required
          disabled={submitting}
        />

        <TextInput
          id="club_contact_information"
          name="club_contact_information"
          label="What is your club's contact information, such as its email?"
          value={values.club_contact_information}
          onChange={updateField}
          error={fieldErrors.club_contact_information}
          required
          disabled={submitting}
        />

        <TextInput
          id="instagram_handle"
          name="instagram_handle"
          label="What is your club's Instagram handle?"
          value={values.instagram_handle}
          onChange={updateField}
          error={fieldErrors.instagram_handle}
          required
          disabled={submitting}
        />

        <label className="checkbox-row">
          <input
            type="checkbox"
            name="is_seeking_teacher_supervisor"
            checked={values.is_seeking_teacher_supervisor}
            onChange={updateField}
            disabled={submitting}
          />
          <span>We are still searching for our club teacher supervisor.</span>
        </label>

        <TextArea
          id="teacher_supervisor_emails"
          name="teacher_supervisor_emails"
          label="Who is/are your club's teacher supervisor(s) for the upcoming year? Please provide their PDSB email."
          value={values.teacher_supervisor_emails}
          onChange={updateField}
          error={fieldErrors.teacher_supervisor_emails}
          rows={3}
          required={!values.is_seeking_teacher_supervisor}
          disabled={submitting || values.is_seeking_teacher_supervisor}
          hint={
            values.is_seeking_teacher_supervisor
              ? "Not required while searching for a supervisor."
              : "One or more exact @pdsb.net emails."
          }
        />

        <SignedFormUpload
          file={file}
          onChange={setFile}
          error={fieldErrors.signed_form}
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
            "Submit club re-application"
          )}
        </button>
      </form>
    </div>
  );
}
