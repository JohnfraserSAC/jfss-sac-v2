import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ClubApplyNotice } from "../components/clubs/ClubApplyNotice";
import { TeacherSupervisorSection } from "../components/clubs/TeacherSupervisorSection";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { TextArea } from "../components/ui/TextArea";
import { TextInput } from "../components/ui/TextInput";
import { Spinner } from "../components/ui/Spinner";
import { CLUB_APPLICATION_SCHOOL_YEAR } from "../config/clubApplications";
import { supabase } from "../lib/supabase";
import {
  deleteClubApplicationDocument,
  uploadClubApplicationDocument,
} from "../services/clubDocuments";
import { submitClubRegistrationApplication } from "../services/clubRequests";
import { isValidPdsbEmail, normalizePdsbEmail } from "../utils/clubPermissions";
import { getErrorMessage } from "../utils/errors";

const INITIAL = {
  proposed_name: "",
  description: "",
  student_benefit: "",
  leader_details: "",
  club_contact_information: "",
  potential_event_ideas: "",
  leader_contact_information: "",
};

export function ClubApplyPage() {
  const { user, profile } = useAuth();
  const [values, setValues] = useState(INITIAL);
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [file, setFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState(null);

  const respondentEmail = profile?.email || user?.email || "";

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function validate() {
    const errors = {};
    if (values.proposed_name.trim().length < 2) {
      errors.proposed_name = "Enter your club name.";
    }
    if (values.description.trim().length < 10) {
      errors.description =
        "Provide a detailed club description (at least 10 characters).";
    }
    if (values.student_benefit.trim().length < 10) {
      errors.student_benefit =
        "Explain how the club benefits JFSS students.";
    }
    if (values.leader_details.trim().length < 5) {
      errors.leader_details = "Include each leader’s full name and grade.";
    }
    if (values.club_contact_information.trim().length < 3) {
      errors.club_contact_information =
        "Provide club contact information such as email or Instagram.";
    }

    if (supervisorName.trim().length < 2) {
      errors.supervisor_name = "Enter the teacher’s full name.";
    }
    const email = normalizePdsbEmail(supervisorEmail);
    if (!isValidPdsbEmail(email)) {
      errors.supervisor_email =
        "Enter an exact teacher @pdsb.net email address.";
    }
    if (!file) {
      errors.signed_form = "Upload the signed Teacher Supervisor Form image.";
    }

    return { errors, email };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setSuccessId(null);

    const { errors, email } = validate();
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
        folder: "new-club-applications",
        userId: user.id,
        submissionId: requestId,
        file,
      });

      await submitClubRegistrationApplication({
        requestId,
        proposedName: values.proposed_name,
        description: values.description,
        studentBenefit: values.student_benefit,
        leaderDetails: values.leader_details,
        teacherSupervisorEmails: [email],
        clubContactInformation: values.club_contact_information,
        teacherSupervisorFormStoragePath: uploadedPath,
        potentialEventIdeas: values.potential_event_ideas,
        leaderContactInformation: values.leader_contact_information,
        schoolYear: CLUB_APPLICATION_SCHOOL_YEAR,
      });

      // Persist supervisor display name when the column is available to the applicant.
      const { error: nameUpdateError } = await supabase
        .from("club_registration_requests")
        .update({ faculty_advisor_name: supervisorName.trim() })
        .eq("id", requestId);
      if (nameUpdateError) {
        // Name capture is best-effort; email + form remain the required records.
      }

      setSuccessId(requestId);
      setValues(INITIAL);
      setSupervisorName("");
      setSupervisorEmail("");
      setFile(null);
      setFieldErrors({});
    } catch (submitError) {
      if (uploadedPath) {
        await deleteClubApplicationDocument(uploadedPath);
      }
      setError(
        getErrorMessage(submitError, "Could not submit your club application."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page narrow-page">
      <ClubApplyNotice accountEmail={respondentEmail} />

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      {successId ? (
        <div className="alert alert--success" role="status">
          <strong>Application submitted</strong>
          <p>
            Your new club application was submitted successfully.{" "}
            <Link className="text-link" to="/my-requests/applications">
              View my requests
            </Link>
          </p>
        </div>
      ) : null}

      <form className="stack" onSubmit={handleSubmit} noValidate>
        <div className="panel form-stack">
          <TextInput
            id="proposed_name"
            name="proposed_name"
            label="What is your club name?"
            value={values.proposed_name}
            onChange={updateField}
            error={fieldErrors.proposed_name}
            required
            disabled={submitting}
          />

          <TextArea
            id="description"
            name="description"
            label="Pitch a quick description of your club and how it benefits the students at JFSS."
            value={values.description}
            onChange={updateField}
            error={fieldErrors.description}
            rows={5}
            required
            disabled={submitting}
            hint="Use this field for the main pitch. Expand the student benefit in the next question."
          />

          <TextArea
            id="student_benefit"
            name="student_benefit"
            label="How does this club benefit students at JFSS?"
            value={values.student_benefit}
            onChange={updateField}
            error={fieldErrors.student_benefit}
            rows={4}
            required
            disabled={submitting}
          />

          <TextArea
            id="leader_details"
            name="leader_details"
            label="Who are/is your club leader(s)? Include each leader’s full name and grade."
            value={values.leader_details}
            onChange={updateField}
            error={fieldErrors.leader_details}
            rows={4}
            required
            disabled={submitting}
          />

          <TextInput
            id="club_contact_information"
            name="club_contact_information"
            label="How can we contact your club? For example, provide your club email or Instagram account."
            value={values.club_contact_information}
            onChange={updateField}
            error={fieldErrors.club_contact_information}
            required
            disabled={submitting}
          />

          <TextArea
            id="potential_event_ideas"
            name="potential_event_ideas"
            label="Does your club have any planned or potential event ideas for the upcoming year? If yes, provide rough details, including what, when, and where."
            value={values.potential_event_ideas}
            onChange={updateField}
            rows={4}
            disabled={submitting}
            hint="Optional"
          />

          <TextArea
            id="leader_contact_information"
            name="leader_contact_information"
            label="Please provide your club leader contact information, such as email or Instagram."
            value={values.leader_contact_information}
            onChange={updateField}
            rows={3}
            disabled={submitting}
            hint="Optional"
          />
        </div>

        <TeacherSupervisorSection
          name={supervisorName}
          email={supervisorEmail}
          onNameChange={(event) => setSupervisorName(event.target.value)}
          onEmailChange={(event) => setSupervisorEmail(event.target.value)}
          file={file}
          onFileChange={setFile}
          nameError={fieldErrors.supervisor_name}
          emailError={fieldErrors.supervisor_email}
          fileError={fieldErrors.signed_form}
          disabled={submitting}
          required
        >
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
              "Submit club application"
            )}
          </button>
        </TeacherSupervisorSection>
      </form>
    </div>
  );
}
