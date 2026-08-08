import { useState } from "react";
import { FormField } from "../ui/FormField";
import { Select } from "../ui/Select";
import { TextArea } from "../ui/TextArea";
import { TextInput } from "../ui/TextInput";
import { Spinner } from "../ui/Spinner";
import { AnnouncementStatusBadge } from "./AnnouncementStatusBadge";
import { getTorontoTomorrowYmd } from "../../utils/torontoDate";

export function AnnouncementForm({
  mode = "create",
  values,
  onChange,
  fieldErrors = {},
  clubs = [],
  showTypeSelector = false,
  clubReadOnly = false,
  reviewNotes = null,
  actions = [],
  submittingAction = null,
  onSubmitAction,
  error = "",
}) {
  const minPostingDate = getTorontoTomorrowYmd();
  const [announcementType, setAnnouncementType] = useState(
    values.clubId ? "CLUB" : "GENERAL",
  );

  function updateField(event) {
    const { name, value } = event.target;
    onChange?.({ ...values, [name]: value });
  }

  function handleTypeChange(event) {
    const nextType = event.target.value;
    setAnnouncementType(nextType);
    if (nextType === "GENERAL") {
      onChange?.({ ...values, clubId: "" });
    }
  }

  return (
    <form
      className="panel form-stack"
      onSubmit={(event) => event.preventDefault()}
      noValidate
    >
      {reviewNotes ? (
        <div className="alert alert--warning" role="status">
          <strong>Review notes</strong>
          <p>{reviewNotes}</p>
        </div>
      ) : null}

      {mode === "edit" && values.status ? (
        <div className="badge-row">
          <AnnouncementStatusBadge status={values.status} />
        </div>
      ) : null}

      {showTypeSelector ? (
        <Select
          id="announcement-type"
          label="Announcement type"
          value={announcementType}
          onChange={handleTypeChange}
        >
          <option value="GENERAL">General announcement</option>
          <option value="CLUB">Club announcement</option>
        </Select>
      ) : null}

      {(announcementType === "CLUB" || (!showTypeSelector && clubs.length > 0)) &&
      !clubReadOnly ? (
        <Select
          id="clubId"
          name="clubId"
          label="Club"
          value={values.clubId || ""}
          onChange={updateField}
          error={fieldErrors.clubId}
          required={!showTypeSelector || announcementType === "CLUB"}
        >
          <option value="">Select a club</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </Select>
      ) : null}

      {clubReadOnly && values.clubName ? (
        <FormField id="club-readonly" label="Club">
          <input
            id="club-readonly"
            className="input"
            value={values.clubName}
            disabled
            readOnly
          />
        </FormField>
      ) : null}

      {clubReadOnly && !values.clubName ? (
        <FormField id="scope-readonly" label="Scope">
          <input
            id="scope-readonly"
            className="input"
            value="General announcement"
            disabled
            readOnly
          />
        </FormField>
      ) : null}

      <TextInput
        id="title"
        name="title"
        label="Title"
        value={values.title}
        onChange={updateField}
        error={fieldErrors.title}
        required
        maxLength={160}
      />

      <TextArea
        id="summary"
        name="summary"
        label="Summary"
        value={values.summary}
        onChange={updateField}
        error={fieldErrors.summary}
        rows={3}
        hint="Optional. Shown on cards and the homepage."
      />

      <TextArea
        id="body"
        name="body"
        label="Body"
        value={values.body}
        onChange={updateField}
        error={fieldErrors.body}
        required
        rows={8}
      />

      <TextInput
        id="imageUrl"
        name="imageUrl"
        type="url"
        label="Image URL"
        value={values.imageUrl}
        onChange={updateField}
        error={fieldErrors.imageUrl}
        placeholder="https://"
      />

      <TextInput
        id="scheduledPostingDate"
        name="scheduledPostingDate"
        type="date"
        label="Announcement posting date"
        value={values.scheduledPostingDate || ""}
        onChange={updateField}
        error={fieldErrors.scheduledPostingDate}
        min={minPostingDate}
        hint="Required to submit. America/Toronto calendar date. Earliest selectable date is tomorrow."
      />

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="button-row">
        {actions.map((action) => (
          <button
            key={action.value}
            type="button"
            className={
              action.primary
                ? "button button--primary"
                : "button button--secondary"
            }
            disabled={Boolean(submittingAction)}
            onClick={() => onSubmitAction?.(action.value)}
          >
            {submittingAction === action.value ? (
              <>
                <Spinner size="sm" label="Saving" /> Working…
              </>
            ) : (
              action.label
            )}
          </button>
        ))}
      </div>
    </form>
  );
}
