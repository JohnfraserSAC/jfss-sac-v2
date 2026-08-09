import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LocalFilePreview } from "../components/ui/LocalFilePreview";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { FilePicker } from "../components/ui/FilePicker";
import { Select } from "../components/ui/Select";
import { TextArea } from "../components/ui/TextArea";
import { TextInput } from "../components/ui/TextInput";
import { Spinner } from "../components/ui/Spinner";
import {
  CLUB_APPLICATION_DOCUMENTS_BUCKET,
  CLUB_LOGOS_BUCKET,
  CLUB_APPLICATION_SCHOOL_YEAR,
  MEETING_DAYS,
  MEETING_FREQUENCIES,
  REAPP_ATTACHMENT_ALLOWED_TYPES,
  REAPP_ATTACHMENT_MAX_BYTES,
  REAPP_LOGO_ALLOWED_TYPES,
  REAPP_LOGO_MAX_BYTES,
} from "../config/clubApplications";
import { supabase } from "../lib/supabase";
import {
  listEligibleClubsForReapplication,
  submitClubReapplication,
  validateSupervisorEntries,
} from "../services/clubReapplications";
import { getErrorMessage } from "../utils/errors";

const INITIAL = {
  club_id: "",
  short_description: "",
  description: "",
  public_email: "",
  instagram_handle: "",
  meeting_frequency: "",
  meeting_days: [],
  meeting_time_details: "",
  meeting_location: "",
  is_seeking_teacher_supervisor: false,
  declaration_accepted: false,
};

function emptySupervisors() {
  return [{ name: "", email: "" }];
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function ClubReapplyPage() {
  const { user, profile } = useAuth();
  const listboxId = useId();
  const comboboxRef = useRef(null);

  const [search, setSearch] = useState("");
  const [options, setOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedClub, setSelectedClub] = useState(null);

  const [values, setValues] = useState(INITIAL);
  const [supervisors, setSupervisors] = useState(emptySupervisors);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [successId, setSuccessId] = useState(null);

  const applicantName = profile?.full_name || "Signed-in student";
  const applicantEmail = profile?.email || user?.email || "";

  useEffect(() => {
    let active = true;
    const handle = window.setTimeout(async () => {
      setOptionsLoading(true);
      try {
        const data = await listEligibleClubsForReapplication(search);
        if (active) {
          setOptions(data);
          setActiveIndex(0);
        }
      } catch (loadError) {
        if (active) {
          setOptions([]);
          setError(
            getErrorMessage(loadError, "Could not load eligible past clubs."),
          );
        }
      } finally {
        if (active) setOptionsLoading(false);
      }
    }, 200);

    return () => {
      active = false;
      window.clearTimeout(handle);
    };
  }, [search]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const selectedLabel = useMemo(() => {
    if (!selectedClub) return "";
    return selectedClub.name;
  }, [selectedClub]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function toggleMeetingDay(day) {
    setValues((current) => {
      const has = current.meeting_days.includes(day);
      return {
        ...current,
        meeting_days: has
          ? current.meeting_days.filter((item) => item !== day)
          : [...current.meeting_days, day],
      };
    });
  }

  function selectClub(club) {
    setSelectedClub(club);
    setValues((current) => ({ ...current, club_id: club.id }));
    setSearch(club.name);
    setListOpen(false);
    setFieldErrors((current) => ({ ...current, club_id: undefined }));
  }

  function clearClub() {
    setSelectedClub(null);
    setValues((current) => ({ ...current, club_id: "" }));
    setSearch("");
  }

  function updateSupervisor(index, key, value) {
    setSupervisors((current) =>
      current.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }

  function addSupervisorRow() {
    if (supervisors.length >= 3) return;
    setSupervisors((current) => [...current, { name: "", email: "" }]);
  }

  function removeSupervisorRow(index) {
    setSupervisors((current) =>
      current.length <= 1 ? emptySupervisors() : current.filter((_, i) => i !== index),
    );
  }

  function onLogoChange(file) {
    setLogoFile(file || null);
  }

  function onAttachmentsChange(files) {
    const next = Array.isArray(files) ? files : files ? [files] : [];
    setAttachments((current) => [...current, ...next]);
  }

  function removeAttachment(index) {
    setAttachments((current) => current.filter((_, i) => i !== index));
  }

  function validate() {
    const errors = {};
    if (!values.club_id || !selectedClub) {
      errors.club_id = "Select an eligible past club.";
    }
    if (values.short_description.trim().length < 10) {
      errors.short_description = "Enter a short public description.";
    }
    if (values.description.trim().length < 10) {
      errors.description = "Enter the full club purpose/description.";
    }
    if (!isValidEmail(values.public_email)) {
      errors.public_email = "Enter a valid public club email.";
    }
    if (!values.meeting_frequency) {
      errors.meeting_frequency = "Select a meeting frequency.";
    }
    if (
      ["Weekly", "Biweekly"].includes(values.meeting_frequency) &&
      values.meeting_days.length < 1
    ) {
      errors.meeting_days = "Select at least one meeting day.";
    }
    if (logoFile) {
      if (!REAPP_LOGO_ALLOWED_TYPES.includes(logoFile.type)) {
        errors.logo = "Logo must be JPEG, PNG, or WebP.";
      } else if (logoFile.size > REAPP_LOGO_MAX_BYTES) {
        errors.logo = "Logo must be 5 MB or smaller.";
      }
    }
    for (const file of attachments) {
      if (!REAPP_ATTACHMENT_ALLOWED_TYPES.includes(file.type)) {
        errors.attachments = "Attachments must be JPEG, PNG, WebP, or PDF.";
        break;
      }
      if (file.size > REAPP_ATTACHMENT_MAX_BYTES) {
        errors.attachments = "Each attachment must be 10 MB or smaller.";
        break;
      }
    }

    const { error: supervisorError } = validateSupervisorEntries(supervisors, {
      required: !values.is_seeking_teacher_supervisor,
    });
    if (supervisorError) {
      errors.supervisors = supervisorError;
    }

    if (!values.declaration_accepted) {
      errors.declaration_accepted = "Confirm the declaration to submit.";
    }

    return errors;
  }

  async function uploadFile(bucket, path, file) {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
    if (uploadError) {
      throw new Error(
        getErrorMessage(uploadError, `Could not upload ${file.name}.`),
      );
    }
    return path;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setError("");
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Fix the highlighted fields and try again.");
      return;
    }

    const { supervisors: cleanSupervisors } = validateSupervisorEntries(
      supervisors,
      { required: !values.is_seeking_teacher_supervisor },
    );

    const requestId = crypto.randomUUID();
    setSubmitting(true);

    try {
      let logoPath = null;
      if (logoFile) {
        setUploadProgress("Uploading logo…");
        const ext =
          logoFile.type === "image/png"
            ? "png"
            : logoFile.type === "image/webp"
              ? "webp"
              : "jpg";
        logoPath = `reapplication-logos/${user.id}/${requestId}/${crypto.randomUUID()}.${ext}`;
        await uploadFile(CLUB_LOGOS_BUCKET, logoPath, logoFile);
      }

      const uploadedAttachments = [];
      for (let i = 0; i < attachments.length; i += 1) {
        const file = attachments[i];
        setUploadProgress(
          `Uploading attachment ${i + 1} of ${attachments.length}…`,
        );
        const ext =
          file.type === "application/pdf"
            ? "pdf"
            : file.type === "image/png"
              ? "png"
              : file.type === "image/webp"
                ? "webp"
                : "jpg";
        const path = `reapplications/${user.id}/${requestId}/${crypto.randomUUID()}.${ext}`;
        await uploadFile(CLUB_APPLICATION_DOCUMENTS_BUCKET, path, file);
        uploadedAttachments.push({
          storage_path: path,
          original_filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        });
      }

      setUploadProgress("Submitting re-application…");
      await submitClubReapplication({
        requestId,
        clubId: values.club_id,
        shortDescription: values.short_description.trim(),
        description: values.description.trim(),
        publicEmail: values.public_email.trim().toLowerCase(),
        instagramHandle: values.instagram_handle.trim() || null,
        meetingFrequency: values.meeting_frequency,
        meetingDays: values.meeting_days,
        meetingTimeDetails: values.meeting_time_details.trim() || null,
        meetingLocation: values.meeting_location.trim() || null,
        proposedLogoStoragePath: logoPath,
        isSeekingTeacherSupervisor: values.is_seeking_teacher_supervisor,
        declarationAccepted: true,
        supervisors: cleanSupervisors,
        attachments: uploadedAttachments,
      });

      setSuccessId(requestId);
    } catch (submitError) {
      setError(
        getErrorMessage(submitError, "Could not submit the re-application."),
      );
    } finally {
      setUploadProgress("");
      setSubmitting(false);
    }
  }

  if (successId) {
    return (
      <div className="page">
        <div className="alert alert--success" role="status">
          <p>
            Your Club Re-Application for {CLUB_APPLICATION_SCHOOL_YEAR} was
            received. Submission does not guarantee approval. Track status on{" "}
            <Link to="/my-requests">My Requests</Link>. If approved, you become
            an OWNER of the existing club record.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {error ? <ErrorMessage message={error} /> : null}

      <form className="stack form-card" onSubmit={handleSubmit} noValidate>
        <section className="stack" aria-labelledby="applicant-heading">
          <h2 id="applicant-heading">Applicant</h2>
          <p>
            <strong>{applicantName}</strong>
            <br />
            {applicantEmail}
          </p>
          <p className="muted">
            Identity and submission time are taken from your signed-in account.
          </p>
        </section>

        <section className="stack" aria-labelledby="club-select-heading">
          <h2 id="club-select-heading">Past club</h2>
          <div className="field">
            <label htmlFor="past-club-combobox">
              Search eligible past clubs <span aria-hidden="true">*</span>
            </label>
            <div className="combobox" ref={comboboxRef}>
              <input
                id="past-club-combobox"
                role="combobox"
                aria-expanded={listOpen}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-required="true"
                autoComplete="off"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setListOpen(true);
                  if (selectedClub) clearClub();
                }}
                onFocus={() => setListOpen(true)}
                onKeyDown={(event) => {
                  if (!listOpen && (event.key === "ArrowDown" || event.key === "Enter")) {
                    setListOpen(true);
                    return;
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveIndex((i) => Math.min(i + 1, Math.max(options.length - 1, 0)));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveIndex((i) => Math.max(i - 1, 0));
                  } else if (event.key === "Enter" && listOpen && options[activeIndex]) {
                    event.preventDefault();
                    selectClub(options[activeIndex]);
                  } else if (event.key === "Escape") {
                    setListOpen(false);
                  }
                }}
                placeholder="Type a club name or alias…"
              />
              {listOpen ? (
                <ul
                  id={listboxId}
                  role="listbox"
                  className="combobox__list"
                >
                  {optionsLoading ? (
                    <li className="combobox__empty">Searching…</li>
                  ) : options.length === 0 ? (
                    <li className="combobox__empty">No eligible clubs match.</li>
                  ) : (
                    options.map((club, index) => (
                      <li key={club.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selectedClub?.id === club.id}
                          className={
                            index === activeIndex
                              ? "combobox__option combobox__option--active"
                              : "combobox__option"
                          }
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectClub(club)}
                        >
                          <span>{club.name}</span>
                          {club.aliases?.length ? (
                            <span className="muted">
                              {" "}
                              · aliases: {club.aliases.join(", ")}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </div>
            {fieldErrors.club_id ? (
              <p className="field-error">{fieldErrors.club_id}</p>
            ) : null}
          </div>

          {selectedClub ? (
            <div className="notice-panel" aria-live="polite">
              <h3>{selectedLabel}</h3>
              {selectedClub.historical_description ? (
                <p>{selectedClub.historical_description}</p>
              ) : null}
              {selectedClub.historical_meeting_schedule ? (
                <p>
                  <strong>Historical schedule:</strong>{" "}
                  {selectedClub.historical_meeting_schedule}
                </p>
              ) : null}
              {selectedClub.historical_meeting_location ? (
                <p>
                  <strong>Historical location:</strong>{" "}
                  {selectedClub.historical_meeting_location}
                </p>
              ) : null}
              <button type="button" className="button button--ghost" onClick={clearClub}>
                Change club
              </button>
            </div>
          ) : null}
        </section>

        <section className="stack" aria-labelledby="profile-heading">
          <h2 id="profile-heading">Updated club profile</h2>
          <TextArea
            id="short_description"
            name="short_description"
            label="Short public description"
            required
            value={values.short_description}
            onChange={updateField}
            error={fieldErrors.short_description}
          />
          <TextArea
            id="description"
            name="description"
            label="Full club purpose / description"
            required
            value={values.description}
            onChange={updateField}
            error={fieldErrors.description}
          />
          <TextInput
            id="public_email"
            name="public_email"
            type="email"
            label="Public club email"
            required
            value={values.public_email}
            onChange={updateField}
            error={fieldErrors.public_email}
          />
          <TextInput
            id="instagram_handle"
            name="instagram_handle"
            label="Instagram handle (optional)"
            value={values.instagram_handle}
            onChange={updateField}
          />
          <Select
            id="meeting_frequency"
            name="meeting_frequency"
            label="Meeting frequency"
            required
            value={values.meeting_frequency}
            onChange={updateField}
            error={fieldErrors.meeting_frequency}
          >
            <option value="">Select frequency</option>
            {MEETING_FREQUENCIES.map((freq) => (
              <option key={freq} value={freq}>
                {freq}
              </option>
            ))}
          </Select>
          <fieldset className="field">
            <legend>
              Meeting days
              {["Weekly", "Biweekly"].includes(values.meeting_frequency)
                ? " *"
                : " (optional)"}
            </legend>
            <div className="checkbox-row">
              {MEETING_DAYS.map((day) => (
                <label key={day} className="checkbox">
                  <input
                    type="checkbox"
                    checked={values.meeting_days.includes(day)}
                    onChange={() => toggleMeetingDay(day)}
                  />
                  {day}
                </label>
              ))}
            </div>
            {fieldErrors.meeting_days ? (
              <p className="field-error">{fieldErrors.meeting_days}</p>
            ) : null}
          </fieldset>
          <TextInput
            id="meeting_time_details"
            name="meeting_time_details"
            label="Meeting time / details (optional)"
            placeholder="e.g. lunch, before school, after school"
            value={values.meeting_time_details}
            onChange={updateField}
          />
          <TextInput
            id="meeting_location"
            name="meeting_location"
            label="Meeting location (optional)"
            value={values.meeting_location}
            onChange={updateField}
          />
        </section>

        <section className="stack" aria-labelledby="logo-heading">
          <h2 id="logo-heading">Optional club logo</h2>
          <p className="muted">
            JPEG, PNG, or WebP · max 5 MB. If you leave this blank, any existing
            club logo is preserved.
          </p>
          <FilePicker
            id="logo"
            label="Club logo"
            accept="image/jpeg,image/png,image/webp"
            files={logoFile}
            buttonLabel="Choose logo"
            emptyLabel="No logo chosen"
            error={fieldErrors.logo}
            onChange={onLogoChange}
          />
          {logoPreview ? (
            <a
              href={logoPreview}
              target="_blank"
              rel="noreferrer"
              className="logo-preview-link"
              title="Open logo in a new tab"
            >
              <img
                src={logoPreview}
                alt="Logo preview"
                className="logo-preview"
              />
            </a>
          ) : null}
        </section>

        <section className="stack" aria-labelledby="supervisor-heading">
          <h2 id="supervisor-heading">Teacher supervisors</h2>
          <label className="checkbox">
            <input
              type="checkbox"
              name="is_seeking_teacher_supervisor"
              checked={values.is_seeking_teacher_supervisor}
              onChange={updateField}
            />
            We are still searching for our club teacher supervisor.
          </label>
          {!values.is_seeking_teacher_supervisor ? (
            <p className="muted">Provide one to three supervisors.</p>
          ) : (
            <p className="muted">
              Supervisor entries are optional while you are still searching.
            </p>
          )}
          {supervisors.map((row, index) => (
            <div className="grid-2" key={`sup-${index}`}>
              <TextInput
                id={`sup-name-${index}`}
                label={`Supervisor ${index + 1} full name`}
                value={row.name}
                onChange={(event) =>
                  updateSupervisor(index, "name", event.target.value)
                }
              />
              <TextInput
                id={`sup-email-${index}`}
                type="email"
                label={`Supervisor ${index + 1} PDSB email`}
                value={row.email}
                onChange={(event) =>
                  updateSupervisor(index, "email", event.target.value)
                }
              />
              {supervisors.length > 1 ? (
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => removeSupervisorRow(index)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
          {supervisors.length < 3 ? (
            <button type="button" className="button button--ghost" onClick={addSupervisorRow}>
              Add another supervisor
            </button>
          ) : null}
          {fieldErrors.supervisors ? (
            <p className="field-error">{fieldErrors.supervisors}</p>
          ) : null}
        </section>

        <section className="stack" aria-labelledby="attachments-heading">
          <h2 id="attachments-heading">
            Optional signed teacher-supervisor attachments
          </h2>
          <p className="muted">
            JPEG, PNG, WebP, or PDF · max 10 MB each. Not required for approval.
          </p>
          <FilePicker
            id="reapp-attachments"
            label="Attachments"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            files={attachments}
            buttonLabel="Choose files"
            emptyLabel="No attachments chosen"
            error={fieldErrors.attachments}
            onChange={onAttachmentsChange}
          />
          {attachments.length > 0 ? (
            <ul className="stack">
              {attachments.map((file, index) => (
                <li key={`${file.name}-${index}`}>
                  <LocalFilePreview
                    file={file}
                    alt={file.name || "Attachment preview"}
                    removeLabel="Remove"
                    onRemove={() => removeAttachment(index)}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <label className="checkbox">
          <input
            type="checkbox"
            name="declaration_accepted"
            checked={values.declaration_accepted}
            onChange={updateField}
            required
          />
          I confirm that I am authorized to submit this re-application on behalf
          of this club and that the information provided is accurate.
        </label>
        {fieldErrors.declaration_accepted ? (
          <p className="field-error">{fieldErrors.declaration_accepted}</p>
        ) : null}

        {uploadProgress ? <p role="status">{uploadProgress}</p> : null}

        <button type="submit" className="button" disabled={submitting}>
          {submitting ? (
            <>
              <Spinner /> Submitting…
            </>
          ) : (
            "Submit re-application"
          )}
        </button>
      </form>
    </div>
  );
}
