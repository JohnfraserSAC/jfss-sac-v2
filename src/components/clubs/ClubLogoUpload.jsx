import { useState } from "react";
import { LocalFilePreview } from "../ui/LocalFilePreview";
import { FilePicker } from "../ui/FilePicker";
import {
  REAPP_LOGO_ALLOWED_TYPES,
  REAPP_LOGO_MAX_BYTES,
} from "../../config/clubApplications";

function validateClubLogoFile(file) {
  if (!file) return "Choose a club logo image.";
  if (!REAPP_LOGO_ALLOWED_TYPES.includes(file.type)) {
    return "Logo must be JPEG, PNG, or WebP.";
  }
  if (file.size > REAPP_LOGO_MAX_BYTES) {
    return "Logo must be 5 MB or smaller.";
  }
  return null;
}

/** Club logo uploader styled like the signed teacher-supervisor form control. */
export function ClubLogoUpload({
  id = "club-logo",
  label = "Club logo",
  file,
  onChange,
  error,
  disabled = false,
  required = false,
}) {
  const [localError, setLocalError] = useState("");

  function handleFileChange(next) {
    const validationError = next ? validateClubLogoFile(next) : null;
    setLocalError(validationError || "");
    onChange?.(validationError ? null : next);
  }

  return (
    <div className="stack">
      <FilePicker
        id={id}
        label={label}
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        required={required}
        files={file}
        buttonLabel="Choose image"
        emptyLabel="No image chosen"
        hint="JPEG, PNG, or WebP · max 5 MB"
        error={localError || error || undefined}
        onChange={handleFileChange}
      />
      {file ? (
        <div className="signed-form-preview">
          <p className="muted">Selected image preview</p>
          <LocalFilePreview
            file={file}
            disabled={disabled}
            alt="Selected club logo"
            removeLabel="Remove image"
            onRemove={() => {
              setLocalError("");
              onChange?.(null);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
