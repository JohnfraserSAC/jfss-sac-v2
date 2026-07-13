import { useState } from "react";
import { DeleteClubDialog } from "./DeleteClubDialog";
import { ErrorMessage } from "./ErrorMessage";
import { Spinner } from "./Spinner";
import { StatusBadge } from "./StatusBadge";
import { archiveClub, restoreClub } from "../services/clubs";
import { getErrorMessage } from "../utils/errors";

export function ClubDangerZone({
  club,
  membershipCount = null,
  onArchived,
  onRestored,
  onDeleted,
}) {
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isArchived = club?.status === "ARCHIVED";

  async function handleArchive() {
    if (archiveBusy || !club) return;

    setArchiveBusy(true);
    setError("");

    try {
      const updated = await archiveClub(club.id);
      onArchived?.(updated);
    } catch (archiveError) {
      setError(getErrorMessage(archiveError, "Could not archive this club."));
    } finally {
      setArchiveBusy(false);
    }
  }

  async function handleRestore() {
    if (restoreBusy || !club) return;

    setRestoreBusy(true);
    setError("");

    try {
      const updated = await restoreClub(club.id);
      onRestored?.(updated);
    } catch (restoreError) {
      setError(getErrorMessage(restoreError, "Could not restore this club."));
    } finally {
      setRestoreBusy(false);
    }
  }

  return (
    <section className="panel danger-zone" aria-labelledby="danger-zone-title">
      <div className="danger-zone__header">
        <div>
          <p className="eyebrow">Administrator controls</p>
          <h2 id="danger-zone-title">Danger Zone</h2>
          <p className="lede">
            These actions affect the entire club. Prefer archiving when you only
            need to hide the club from the public directory.
          </p>
        </div>
        <StatusBadge status={club.status} />
      </div>

      <dl className="meta-list">
        <div>
          <dt>Club</dt>
          <dd>{club.name}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{club.status}</dd>
        </div>
        <div>
          <dt>Club memberships</dt>
          <dd>
            {membershipCount === null
              ? "Count unavailable"
              : `${membershipCount} membership${membershipCount === 1 ? "" : "s"}`}
          </dd>
        </div>
      </dl>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <div className="danger-zone__actions">
        <div className="danger-zone__action">
          <div>
            <h3>Archive club</h3>
            <p>
              Recommended. Sets status to ARCHIVED, keeps memberships, and
              removes the club from the public approved list. Global system roles
              are unchanged.
            </p>
          </div>
          {isArchived ? (
            <button
              type="button"
              className="button button--secondary"
              onClick={handleRestore}
              disabled={restoreBusy}
            >
              {restoreBusy ? (
                <>
                  <Spinner size="sm" label="Restoring" /> Restoring…
                </>
              ) : (
                "Restore to approved"
              )}
            </button>
          ) : (
            <button
              type="button"
              className="button button--secondary"
              onClick={handleArchive}
              disabled={archiveBusy}
            >
              {archiveBusy ? (
                <>
                  <Spinner size="sm" label="Archiving" /> Archiving…
                </>
              ) : (
                "Archive Club"
              )}
            </button>
          )}
        </div>

        <div className="danger-zone__action danger-zone__action--delete">
          <div>
            <h3>Permanently delete club</h3>
            <p>
              Irreversible. Deletes the club row. Every related OWNER, EXEC, and
              MEMBER membership is removed automatically by cascade. Profiles and
              global roles are not deleted.
            </p>
          </div>
          <button
            type="button"
            className="button button--danger"
            onClick={() => setDeleteOpen(true)}
          >
            Permanently delete club
          </button>
        </div>
      </div>

      <DeleteClubDialog
        open={deleteOpen}
        club={club}
        membershipCount={membershipCount}
        onClose={() => setDeleteOpen(false)}
        onSuccess={onDeleted}
      />
    </section>
  );
}
