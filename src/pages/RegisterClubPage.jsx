import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage } from "../components/ErrorMessage";
import { TextArea, TextInput } from "../components/FormField";
import { Spinner } from "../components/Spinner";
import { submitClubRequest } from "../services/clubRequests";
import { getErrorMessage } from "../utils/errors";
import { validateClubRequestForm } from "../utils/validation";

const INITIAL_VALUES = {
  proposed_name: "",
  short_description: "",
  description: "",
  purpose: "",
  faculty_advisor_name: "",
  faculty_advisor_email: "",
  expected_member_count: "",
  meeting_plan: "",
  constitution_url: "",
};

export function RegisterClubPage() {
  const { user } = useAuth();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState(null);

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setSuccessId(null);

    const { errors, isValid } = validateClubRequestForm(values);
    setFieldErrors(errors);

    if (!isValid) {
      setError("Please fix the highlighted fields before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const request = await submitClubRequest(user.id, values);
      setSuccessId(request.id);
      setValues(INITIAL_VALUES);
      setFieldErrors({});
    } catch (submitError) {
      if (submitError.fieldErrors) {
        setFieldErrors(submitError.fieldErrors);
      }
      setError(getErrorMessage(submitError, "Could not submit your request."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page narrow-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Registration</p>
          <h1>Register a club</h1>
          <p className="lede">
            Submit a club registration request for SAC review. Your signed-in
            account will be recorded as the requester.
          </p>
        </div>
      </header>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      {successId ? (
        <div className="alert alert--success" role="status">
          <strong>Request submitted</strong>
          <p>
            Your club registration request was submitted successfully.{" "}
            <Link className="text-link" to="/my-requests">
              View my requests
            </Link>
          </p>
        </div>
      ) : null}

      <form className="panel form-stack" onSubmit={handleSubmit} noValidate>
        <TextInput
          id="proposed_name"
          name="proposed_name"
          label="Proposed club name"
          value={values.proposed_name}
          onChange={updateField}
          error={fieldErrors.proposed_name}
          required
          maxLength={100}
        />

        <TextInput
          id="short_description"
          name="short_description"
          label="Short description"
          value={values.short_description}
          onChange={updateField}
          error={fieldErrors.short_description}
          hint="Optional one-line summary for the club directory."
        />

        <TextArea
          id="description"
          name="description"
          label="Full description"
          value={values.description}
          onChange={updateField}
          error={fieldErrors.description}
          required
          rows={5}
        />

        <TextArea
          id="purpose"
          name="purpose"
          label="Purpose"
          value={values.purpose}
          onChange={updateField}
          error={fieldErrors.purpose}
          required
          rows={4}
        />

        <TextInput
          id="faculty_advisor_name"
          name="faculty_advisor_name"
          label="Faculty advisor name"
          value={values.faculty_advisor_name}
          onChange={updateField}
          error={fieldErrors.faculty_advisor_name}
        />

        <TextInput
          id="faculty_advisor_email"
          name="faculty_advisor_email"
          type="email"
          label="Faculty advisor email"
          value={values.faculty_advisor_email}
          onChange={updateField}
          error={fieldErrors.faculty_advisor_email}
        />

        <TextInput
          id="expected_member_count"
          name="expected_member_count"
          type="number"
          label="Expected member count"
          value={values.expected_member_count}
          onChange={updateField}
          error={fieldErrors.expected_member_count}
          min={1}
          max={2000}
        />

        <TextArea
          id="meeting_plan"
          name="meeting_plan"
          label="Meeting plan"
          value={values.meeting_plan}
          onChange={updateField}
          error={fieldErrors.meeting_plan}
          rows={3}
        />

        <TextInput
          id="constitution_url"
          name="constitution_url"
          type="url"
          label="Constitution URL"
          value={values.constitution_url}
          onChange={updateField}
          error={fieldErrors.constitution_url}
          placeholder="https://"
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
            "Submit club request"
          )}
        </button>
      </form>
    </div>
  );
}
