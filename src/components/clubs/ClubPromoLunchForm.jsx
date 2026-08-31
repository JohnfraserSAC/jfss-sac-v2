import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getPromoLunchDaysLabel,
  PROMO_LUNCH_DAYS,
  validateClubPromoLunchForm,
} from "../../utils/clubPromoLunch";
import {
  submitClubPromoLunchRequest,
} from "../../services/clubPromoLunch";
import { getErrorMessage } from "../../utils/errors";
import { ErrorMessage } from "../ui/ErrorMessage";
import { Select } from "../ui/Select";
import { Spinner } from "../ui/Spinner";
import { TextArea } from "../ui/TextArea";
import { TextInput } from "../ui/TextInput";

export function ClubPromoLunchForm({ club, canSubmit = true }) {
  const { user } = useAuth();
  const [boothDays, setBoothDays] = useState("");
  const [approvalEmailReceived, setApprovalEmailReceived] = useState(null);
  const [representatives, setRepresentatives] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || !canSubmit || !club) return;

    const validation = validateClubPromoLunchForm({
      boothDays,
      approvalEmailReceived,
      representatives,
    });
    setFieldErrors(validation.errors);
    setError("");

    if (!validation.isValid) {
      setError("Please fix the highlighted fields before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await submitClubPromoLunchRequest({
        requestId: crypto.randomUUID(),
        clubId: club.id,
        ...validation.data,
      });
      setSuccess(true);
    } catch (submitError) {
      setError(
        getErrorMessage(
          submitError,
          "Could not submit the Club Promo Lunch sign-up.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!canSubmit) {
    return (
      <p className="muted">
        Only active club owners can submit this Club Promo Lunch sign-up.
      </p>
    );
  }

  if (success) {
    return (
      <div className="alert alert--success" role="status">
        <strong>Club Promo Lunch sign-up submitted</strong>
        <p>Your sign-up for {club.name} was submitted for review.</p>
        <Link className="text-link" to="/my-requests/promo-lunch">
          View my sign-ups
        </Link>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={handleSubmit} noValidate>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <div className="alert alert--warning" role="status">
        Club Promo Lunch sign-ups are due September 27, 2026.
      </div>
      <section className="panel form-stack">
        <TextInput
          id={`promo-lunch-club-${club.id}`}
          label="Club Name"
          value={club.name}
          disabled
        />
        <Select
          id={`promo-lunch-days-${club.id}`}
          label="What days do you want to run your booth?"
          value={boothDays}
          onChange={(event) => setBoothDays(event.target.value)}
          error={fieldErrors.boothDays}
          required
          disabled={submitting}
        >
          <option value="">Choose an option</option>
          {PROMO_LUNCH_DAYS.map((day) => (
            <option key={day.value} value={day.value}>
              {getPromoLunchDaysLabel(day.value)}
            </option>
          ))}
        </Select>
        <Select
          id={`promo-lunch-approval-${club.id}`}
          label="Did your club receive an approval email?"
          hint="This will be confirmed, so kindly provide truthful details."
          value={
            approvalEmailReceived === null
              ? ""
              : approvalEmailReceived
                ? "YES"
                : "NO"
          }
          onChange={(event) =>
            setApprovalEmailReceived(
              event.target.value === ""
                ? null
                : event.target.value === "YES",
            )
          }
          error={fieldErrors.approvalEmailReceived}
          required
          disabled={submitting}
        >
          <option value="">Choose an option</option>
          <option value="YES">Yes</option>
          <option value="NO">No</option>
        </Select>
        <TextArea
          id={`promo-lunch-representatives-${club.id}`}
          label="Name of representative(s) at your booth"
          hint="Please provide their name and student email."
          value={representatives}
          onChange={(event) => setRepresentatives(event.target.value)}
          error={fieldErrors.representatives}
          rows={5}
          required
          disabled={submitting}
        />
      </section>
      <div className="button-row">
        <button
          type="submit"
          className="button button--primary"
          disabled={submitting || !user}
        >
          {submitting ? <Spinner size="sm" label="Submitting" /> : null}
          Submit sign-up
        </button>
      </div>
    </form>
  );
}
