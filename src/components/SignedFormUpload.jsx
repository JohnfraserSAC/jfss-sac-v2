import { useEffect, useState } from "react";
import { ErrorMessage } from "./ErrorMessage";
import { validateSignedFormFile } from "../services/clubDocuments";

export function SignedFormUpload({
  id = "signed-form",
  label = "Signed Teacher Supervisor Form image",
  file,
  onChange,
  error,
  disabled = false,
  required = true,
}) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFileChange(event) {
    const next = event.target.files?.[0] ?? null;
    const validationError = next ? validateSignedFormFile(next) : null;
    setLocalError(validationError || "");
    onChange?.(validationError ? null : next);
  }

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="input"
        disabled={disabled}
        onChange={handleFileChange}
      />
      <p className="form-hint">JPEG, PNG, or WebP · max 10 MB</p>
      {localError || error ? (
        <ErrorMessage>{localError || error}</ErrorMessage>
      ) : null}
      {previewUrl ? (
        <div className="signed-form-preview">
          <p className="muted">Selected image preview</p>
          <img src={previewUrl} alt="Selected signed teacher supervisor form" />
          <button
            type="button"
            className="button button--secondary"
            disabled={disabled}
            onClick={() => {
              setLocalError("");
              onChange?.(null);
            }}
          >
            Remove image
          </button>
        </div>
      ) : null}
    </div>
  );
}
