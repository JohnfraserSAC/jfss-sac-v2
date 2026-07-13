import { useEffect, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { ErrorMessage } from "./ErrorMessage";
import { TextInput } from "./FormField";
import { StatusBadge } from "./StatusBadge";
import { permanentlyDeleteClub } from "../services/clubs";
import { getErrorMessage } from "../utils/errors";

export function DeleteClubDialog({
  open,
  club,
  membershipCount = null,
  onClose,
  onSuccess,
}) {
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setConfirmation("");
    setBusy(false);
    setError("");
  }, [open, club?.id]);

  const nameMatches =
    Boolean(club?.name) && confirmation.trim() === club.name.trim();

  async function handleConfirm() {
    if (!club || busy || !nameMatches) return;

    setBusy(true);
    setError("");

    try {
      await permanentlyDeleteClub(club.id);
      onSuccess?.({ clubName: club.name });
      onClose?.();
    } catch (deleteError) {
      setError(
        getErrorMessage(
          deleteError,
          "Could not permanently delete this club.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title="Permanently delete club"
      confirmLabel="Permanently delete club"
      onCancel={onClose}
      onConfirm={handleConfirm}
      busy={busy}
      confirmDisabled={!nameMatches}
      destructive
    >
      <p>
        This permanently deletes <strong>{club?.name}</strong> and cannot be
        undone through the normal UI.
      </p>

      <ul className="dialog-list">
        <li>
          Club status: <StatusBadge status={club?.status} />
        </li>
        <li>
          Memberships affected:{" "}
          {membershipCount === null
            ? "Unavailable"
            : membershipCount}
        </li>
        <li>
          Every related club membership (OWNER, EXEC, MEMBER) will be removed
          automatically by the database cascade.
        </li>
        <li>Student profiles and global system roles will not be deleted.</li>
        <li>
          Registration-request history is preserved; any link to this club will
          be cleared.
        </li>
      </ul>

      <TextInput
        id="delete-club-confirmation"
        label={`Type “${club?.name || "club name"}” to confirm deletion`}
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        autoComplete="off"
        required
      />

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
    </ConfirmDialog>
  );
}
