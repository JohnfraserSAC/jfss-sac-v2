import { useEffect, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { ErrorMessage } from "./ErrorMessage";
import { TextArea } from "./FormField";
import { archiveAnnouncement } from "../services/announcements";
import { getErrorMessage } from "../utils/errors";

export function ArchiveAnnouncementDialog({
  open,
  announcement,
  onClose,
  onSuccess,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setBusy(false);
    setError("");
  }, [open, announcement?.id]);

  async function handleConfirm() {
    if (!announcement || busy) return;
    setBusy(true);
    setError("");

    try {
      await archiveAnnouncement(announcement.id);
      onSuccess?.(announcement);
      onClose?.();
    } catch (archiveError) {
      setError(
        getErrorMessage(archiveError, "Could not archive this announcement."),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title="Archive announcement"
      confirmLabel="Archive announcement"
      onCancel={onClose}
      onConfirm={handleConfirm}
      busy={busy}
      destructive
    >
      <p>
        Archive <strong>{announcement?.title}</strong>?
      </p>
      <ul className="dialog-list">
        <li>It will disappear from the homepage and public feed.</li>
        <li>The database row will remain for history.</li>
        <li>This does not permanently delete the announcement.</li>
      </ul>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
    </ConfirmDialog>
  );
}

export function ReviewAnnouncementDialog({
  open,
  title,
  confirmLabel,
  requireNotes = false,
  notesLabel = "Review notes",
  onCancel,
  onConfirm,
  busy = false,
}) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setNotes("");
    setError("");
  }, [open]);

  async function handleConfirm() {
    if (requireNotes && !notes.trim()) {
      setError("Review notes are required for this action.");
      return;
    }

    try {
      await onConfirm?.(notes.trim() || null);
    } catch (confirmError) {
      setError(
        getErrorMessage(confirmError, "Could not complete this review action."),
      );
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title={title}
      confirmLabel={confirmLabel}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      busy={busy}
      confirmDisabled={requireNotes && !notes.trim()}
      destructive={confirmLabel.toLowerCase().includes("reject")}
    >
      <TextArea
        id="review-notes"
        label={notesLabel}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={4}
        required={requireNotes}
        hint={requireNotes ? "Required" : "Optional"}
      />
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
    </ConfirmDialog>
  );
}
