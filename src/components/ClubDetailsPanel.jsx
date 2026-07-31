import { useEffect, useState } from "react";
import { TextArea, TextInput } from "./FormField";
import { ErrorMessage } from "./ErrorMessage";
import { Spinner } from "./Spinner";
import { ClubSupervisorSubmitForm } from "./ClubSupervisorSubmitForm";
import { StatusBadge } from "./StatusBadge";
import { updateOwnedClubProfile } from "../services/clubs";
import {
  getActiveClubAdvisors,
  getClubSupervisorRequests,
} from "../services/clubSupervisors";
import { isClubOwner } from "../utils/clubPermissions";
import { getErrorMessage } from "../utils/errors";

function ClubDetailsForm({ club, canEdit, onClubUpdated }) {
  const [name, setName] = useState(club?.name || "");
  const [description, setDescription] = useState(club?.description || "");
  const [contactEmail, setContactEmail] = useState(club?.contact_email || "");
  const [leaderContact, setLeaderContact] = useState(
    club?.leader_contact_information || "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSave(event) {
    event.preventDefault();
    if (busy || !canEdit) return;

    setError("");
    setSuccess("");
    setBusy(true);

    try {
      const updated = await updateOwnedClubProfile(club.id, {
        name,
        description,
        contactEmail,
        leaderContactInformation: leaderContact,
        shortDescription: club.short_description,
      });
      setSuccess("Club details saved.");
      onClubUpdated?.(updated);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Could not save club details."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>Club details</h2>
      <p className="muted">
        Public club contact and leader contact appear on the club page. The club
        URL slug stays <code>{club.slug}</code> when you rename the club.
      </p>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {success ? (
        <div className="alert alert--success" role="status">
          <strong>Saved</strong>
          <p>{success}</p>
        </div>
      ) : null}

      <form className="stack" onSubmit={handleSave} noValidate>
        <TextInput
          id="club-name"
          label="Club name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          disabled={!canEdit || busy}
        />
        <TextArea
          id="club-description"
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={6}
          required
          disabled={!canEdit || busy}
        />
        <TextInput
          id="club-contact"
          type="email"
          label="Club contact"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          hint="Public club contact email shown on the club page."
          disabled={!canEdit || busy}
        />
        <TextInput
          id="club-leader-contact"
          label="Club leader contact"
          value={leaderContact}
          onChange={(event) => setLeaderContact(event.target.value)}
          hint="Public leader contact (email, Instagram, or other). Visible on the club page."
          disabled={!canEdit || busy}
        />

        {canEdit ? (
          <div className="button-row">
            <button
              type="submit"
              className="button button--primary"
              disabled={busy}
            >
              {busy ? <Spinner size="sm" label="Saving" /> : null}
              {busy ? "Saving…" : "Save details"}
            </button>
          </div>
        ) : (
          <p className="muted">Only club owners can edit these details.</p>
        )}
      </form>
    </section>
  );
}

export function ClubDetailsPanel({
  club,
  annual,
  membership,
  isSacAdmin = false,
  canArchive,
  onClubUpdated,
  onOpenArchive,
  onSupervisorSubmitted,
  canWithdrawPending,
  onOpenWithdraw,
}) {
  const canEdit = isSacAdmin || isClubOwner(membership?.role);
  const canSubmitSupervisor =
    isClubOwner(membership?.role) &&
    membership?.status === "ACTIVE" &&
    (annual?.status === "PENDING_SUPERVISOR" || annual?.status === "ACTIVE") &&
    club?.status === "APPROVED" &&
    !club?.deleted_at;

  const [advisors, setAdvisors] = useState([]);
  const [requestHistory, setRequestHistory] = useState([]);
  const [supervisorNotice, setSupervisorNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSupervisorState() {
      if (!club?.id) return;
      try {
        const [advisorRows, requestRows] = await Promise.all([
          getActiveClubAdvisors(club.id, annual?.school_year).catch(() => []),
          getClubSupervisorRequests(club.id).catch(() => []),
        ]);
        if (!active) return;
        setAdvisors(advisorRows);
        setRequestHistory(requestRows || []);
      } catch {
        if (!active) return;
        setAdvisors([]);
        setRequestHistory([]);
      }
    }

    void loadSupervisorState();
    return () => {
      active = false;
    };
  }, [club?.id, annual?.school_year, supervisorNotice]);

  return (
    <div
      id="manage-panel-details"
      role="tabpanel"
      aria-labelledby="manage-tab-details"
      className="stack"
    >
      <ClubDetailsForm
        key={`${club.id}-${club.updated_at || "initial"}`}
        club={club}
        canEdit={canEdit}
        onClubUpdated={onClubUpdated}
      />

      <section className="panel">
        <h2>Approved teacher supervisors</h2>
        {advisors.length > 0 ? (
          <ul className="stack">
            {advisors.map((advisor) => (
              <li key={advisor.id}>
                <strong>{advisor.supervisor_name}</strong>
                <span className="muted"> · {advisor.supervisor_email}</span>
                <StatusBadge status="APPROVED" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No approved teacher supervisors yet.</p>
        )}

        {canWithdrawPending ? (
          <div className="button-row" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="button button--secondary"
              onClick={onOpenWithdraw}
            >
              Withdraw pending approval
            </button>
          </div>
        ) : null}
      </section>

      {canSubmitSupervisor || requestHistory.length > 0 ? (
        <ClubSupervisorSubmitForm
          club={club}
          canSubmit={canSubmitSupervisor}
          onSubmitted={() => {
            setSupervisorNotice(`submitted-${Date.now()}`);
            onSupervisorSubmitted?.();
          }}
        />
      ) : isClubOwner(membership?.role) ? (
        <section className="panel">
          <h2>Teacher supervisor request</h2>
          <p className="muted">
            Supervisor requests unlock while the club is ACTIVE or pending
            teacher supervisor approval.
          </p>
        </section>
      ) : null}

      {canArchive ? (
        <section
          className="panel danger-zone"
          aria-labelledby="owner-archive-title"
        >
          <div className="danger-zone__header">
            <div>
              <p className="eyebrow">Danger zone</p>
              <h2 id="owner-archive-title">Archive club</h2>
              <p className="lede">
                Archives this club for the current school year. New-club
                applications are permanently removed from the portal.
                Historical clubs stay inactive and may later be eligible for
                reapplication. Clubs cannot be hard-deleted from the database.
              </p>
            </div>
          </div>
          <div className="danger-zone__actions">
            <div className="danger-zone__action">
              <div>
                <h3>Archive club</h3>
                <p>
                  Removes the club from Explore and active operations, marks
                  memberships inactive, and keeps the club available for
                  re-application.
                </p>
              </div>
              <button
                type="button"
                className="button button--danger"
                onClick={onOpenArchive}
              >
                Archive Club
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
