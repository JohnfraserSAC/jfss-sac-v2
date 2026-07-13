import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { ErrorMessage } from "./ErrorMessage";
import { MemberSearchInput } from "./MemberSearchInput";
import { PermissionNotice } from "./PermissionNotice";
import { Select, TextInput } from "./FormField";
import {
  canAddRole,
  getAddableRoles,
  getClubRoleLabel,
} from "../utils/clubPermissions";
import { addClubMembership } from "../services/memberships";
import { getErrorMessage } from "../utils/errors";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function AddClubMemberDialog({
  open,
  club,
  currentUserId,
  currentUserRole,
  isSacAdmin,
  isSiteAdmin,
  existingUserIds = [],
  searchAvailable = false,
  searchWarning = null,
  onClose,
  onSuccess,
}) {
  const addableRoles = useMemo(
    () =>
      getAddableRoles({
        currentUserRole,
        isSacAdmin,
        isSiteAdmin,
      }),
    [currentUserRole, isSacAdmin, isSiteAdmin],
  );

  const [selectedUser, setSelectedUser] = useState(null);
  const [manualUserId, setManualUserId] = useState("");
  const [role, setRole] = useState(addableRoles[0] || "MEMBER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedUser(null);
    setManualUserId("");
    setRole(addableRoles[0] || "MEMBER");
    setBusy(false);
    setError("");
  }, [open, addableRoles]);

  const resolvedUserId = selectedUser?.id || manualUserId.trim();

  async function handleConfirm() {
    setError("");

    if (!resolvedUserId) {
      setError("Select a student or enter a user ID.");
      return;
    }

    if (!selectedUser && !UUID_PATTERN.test(resolvedUserId)) {
      setError("Enter a valid user UUID.");
      return;
    }

    if (existingUserIds.includes(resolvedUserId)) {
      setError("This student is already a member of this club.");
      return;
    }

    if (resolvedUserId === club?.created_by && role !== "OWNER") {
      // created_by may already be OWNER; still allow if not already a member.
    }

    if (
      !canAddRole({
        currentUserRole,
        targetRole: role,
        isSacAdmin,
        isSiteAdmin,
      })
    ) {
      setError("You do not have permission to assign that role.");
      return;
    }

    if (selectedUser?.is_active === false) {
      setError("Inactive users cannot be added to a club.");
      return;
    }

    setBusy(true);

    try {
      await addClubMembership({
        clubId: club.id,
        userId: resolvedUserId,
        role,
        addedBy: currentUserId,
      });
      onSuccess?.({
        userId: resolvedUserId,
        role,
        label:
          selectedUser?.full_name ||
          selectedUser?.email ||
          resolvedUserId,
      });
      onClose?.();
    } catch (addError) {
      setError(getErrorMessage(addError, "Could not add this club member."));
    } finally {
      setBusy(false);
    }
  }

  if (addableRoles.length === 0) {
    return (
      <ConfirmDialog
        open={open}
        title="Add club member"
        confirmLabel="Close"
        cancelLabel="Cancel"
        onCancel={onClose}
        onConfirm={onClose}
        confirmDisabled={false}
      >
        <ErrorMessage title="Not allowed">
          Your role cannot add members to this club.
        </ErrorMessage>
      </ConfirmDialog>
    );
  }

  return (
    <ConfirmDialog
      open={open}
      title="Add club member"
      confirmLabel="Add member"
      onCancel={onClose}
      onConfirm={handleConfirm}
      busy={busy}
      confirmDisabled={!resolvedUserId || !role}
    >
      <p>
        Add a student to <strong>{club?.name}</strong> with a club-scoped role.
        OWNER cannot be assigned here.
      </p>

      {searchWarning ? (
        <PermissionNotice title="Profile search unavailable">
          {searchWarning} Until a safe student-search RPC or broader profiles
          read policy exists, you can add a member by pasting their user UUID.
        </PermissionNotice>
      ) : null}

      {searchAvailable ? (
        <MemberSearchInput
          selectedUser={selectedUser}
          onSelect={setSelectedUser}
          excludeUserIds={existingUserIds}
        />
      ) : (
        <TextInput
          id="manual-user-id"
          label="Student user ID"
          value={manualUserId}
          onChange={(event) => {
            setManualUserId(event.target.value);
            setSelectedUser(null);
          }}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          hint="Temporary fallback while student profile search is unavailable."
          required
        />
      )}

      <Select
        id="add-member-role"
        label="Club role"
        value={role}
        onChange={(event) => setRole(event.target.value)}
        required
      >
        {addableRoles.map((option) => (
          <option key={option} value={option}>
            {getClubRoleLabel(option)}
          </option>
        ))}
      </Select>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
    </ConfirmDialog>
  );
}
