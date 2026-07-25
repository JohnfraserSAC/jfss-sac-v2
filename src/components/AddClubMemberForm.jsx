import { useEffect, useMemo, useState } from "react";
import { ErrorMessage } from "./ErrorMessage";
import { PermissionNotice } from "./PermissionNotice";
import { Select, TextInput } from "./FormField";
import { Spinner } from "./Spinner";
import { ClubRoleBadge } from "./ClubRoleBadge";
import {
  canAddClubRole,
  getAddableRoles,
  getClubRoleLabel,
  isValidPdsbEmail,
  normalizePdsbEmail,
} from "../utils/clubPermissions";
import {
  addClubMembership,
  findStudentByExactEmail,
  reactivateClubMembership,
} from "../services/memberships";
import { getErrorMessage } from "../utils/errors";

function alreadyActiveMessage(role) {
  if (role === "EXEC") {
    return "This student is already an Executive of this club.";
  }
  if (role === "OWNER") {
    return "This student is already an Owner of this club.";
  }
  return "This student is already a Member of this club.";
}

export function ExactEmailSearch({
  clubId,
  lookupAvailable,
  lookupWarning,
  onFound,
  disabled = false,
  resetToken = 0,
}) {
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setEmail("");
    setError("");
  }, [clubId, resetToken]);

  async function handleSearch(event) {
    event.preventDefault();
    if (searching || disabled || !lookupAvailable) return;

    setError("");
    onFound?.(null);

    const normalized = normalizePdsbEmail(email);
    if (!normalized) {
      setError("Enter the student’s complete PDSB email address.");
      return;
    }

    if (!isValidPdsbEmail(normalized)) {
      setError(
        "Enter the student’s complete @pdsb.net email address.",
      );
      return;
    }

    setSearching(true);

    try {
      const student = await findStudentByExactEmail({
        clubId,
        email: normalized,
      });

      if (!student) {
        setError(
          "No eligible registered student was found with that email.",
        );
        onFound?.(null);
        return;
      }

      onFound?.(student);
    } catch (searchError) {
      onFound?.(null);
      setError(
        getErrorMessage(
          searchError,
          "Unable to search for that student.",
        ),
      );
    } finally {
      setSearching(false);
    }
  }

  return (
    <form className="exact-email-search" onSubmit={handleSearch} noValidate>
      <TextInput
        id="student-email"
        type="email"
        label="Student PDSB email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="firstname.lastname@pdsb.net"
        required
        disabled={disabled || !lookupAvailable || searching}
        hint="Enter the student’s complete PDSB email address. The school directory cannot be browsed."
        autoComplete="off"
      />

      <button
        type="submit"
        className="button button--secondary"
        disabled={disabled || !lookupAvailable || searching || !email.trim()}
      >
        {searching ? (
          <>
            <Spinner size="sm" label="Searching" /> Searching…
          </>
        ) : (
          "Find student"
        )}
      </button>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {!lookupAvailable && lookupWarning ? (
        <PermissionNotice title="Student lookup unavailable">
          {lookupWarning}
        </PermissionNotice>
      ) : null}
    </form>
  );
}

export function StudentSearchResult({ student }) {
  if (!student) return null;

  return (
    <div className="student-result" role="status">
      {student.avatar_url ? (
        <img
          src={student.avatar_url}
          alt=""
          className="student-result__avatar"
        />
      ) : (
        <div
          className="student-result__avatar student-result__avatar--fallback"
          aria-hidden="true"
        >
          {(student.full_name || student.email || "?").charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <strong>{student.full_name || "Registered student"}</strong>
        <p>{student.email}</p>
        {student.existing_role ? (
          <p className="muted">
            Existing membership: {getClubRoleLabel(student.existing_role)}
            {student.existing_status ? ` · ${student.existing_status}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AddClubMemberForm({
  club,
  currentUserId,
  currentUserRole,
  isSacAdmin = false,
  existingMemberships = [],
  lookupAvailable = false,
  lookupWarning = null,
  onSuccess,
}) {
  const activeOwnerCount = useMemo(
    () =>
      (existingMemberships || []).filter(
        (row) => row.role === "OWNER" && row.status === "ACTIVE",
      ).length,
    [existingMemberships],
  );

  const addableRoles = useMemo(
    () =>
      getAddableRoles({
        currentUserRole,
        isSacAdmin,
        activeOwnerCount,
      }),
    [currentUserRole, isSacAdmin, activeOwnerCount],
  );

  const [student, setStudent] = useState(null);
  const [role, setRole] = useState(addableRoles[0] || "MEMBER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    setRole(addableRoles[0] || "MEMBER");
  }, [addableRoles]);

  const existingFromList = student
    ? existingMemberships.find((row) => row.user_id === student.id)
    : null;

  const existingRole =
    student?.existing_role || existingFromList?.role || null;
  const existingStatus =
    student?.existing_status || existingFromList?.status || null;

  const isAlreadyActive = existingRole && existingStatus === "ACTIVE";
  const isInactive = existingRole && existingStatus === "INACTIVE";

  function resetForm() {
    setStudent(null);
    setRole(addableRoles[0] || "MEMBER");
    setResetToken((value) => value + 1);
  }

  async function handleAdd(selectedRole = role) {
    if (busy) return;

    setError("");
    setSuccess("");

    if (!currentUserId) {
      setError("You must be signed in to add club members.");
      return;
    }

    if (!club?.id) {
      setError("A club is required.");
      return;
    }

    if (!student?.id) {
      setError("Find a registered student before adding them.");
      return;
    }

    if (!["OWNER", "EXEC", "MEMBER"].includes(selectedRole)) {
      setError("Choose a valid club role.");
      return;
    }

    if (
      !canAddClubRole({
        currentUserRole,
        newRole: selectedRole,
        isSacAdmin,
        activeOwnerCount,
      })
    ) {
      setError("You do not have permission to assign that role.");
      return;
    }

    if (existingRole === "OWNER" && existingStatus === "ACTIVE") {
      setError(alreadyActiveMessage("OWNER"));
      return;
    }

    if (isAlreadyActive) {
      setError(alreadyActiveMessage(existingRole));
      return;
    }

    setBusy(true);

    try {
      if (isInactive) {
        await reactivateClubMembership({
          clubId: club.id,
          userId: student.id,
          role: selectedRole,
          addedBy: currentUserId,
        });
        setSuccess(
          `Membership reactivated as ${getClubRoleLabel(selectedRole)}.`,
        );
      } else {
        await addClubMembership({
          clubId: club.id,
          userId: student.id,
          role: selectedRole,
          addedBy: currentUserId,
        });
        setSuccess(
          `Student added as ${getClubRoleLabel(selectedRole)}.`,
        );
      }

      const label = student.full_name || student.email;
      resetForm();
      onSuccess?.({
        userId: student.id,
        role: selectedRole,
        label,
      });
    } catch (addError) {
      setError(getErrorMessage(addError, "Could not add this club member."));
    } finally {
      setBusy(false);
    }
  }

  if (addableRoles.length === 0) {
    return (
      <PermissionNotice title="Cannot add members">
        Your role cannot add members to this club.
      </PermissionNotice>
    );
  }

  return (
    <section className="panel add-member-panel">
      <h2>Add club member</h2>
      <p className="muted">
        Enter the student’s complete PDSB email address. The school directory
        cannot be browsed.
      </p>

      <ExactEmailSearch
        clubId={club.id}
        lookupAvailable={lookupAvailable}
        lookupWarning={lookupWarning}
        resetToken={resetToken}
        onFound={(next) => {
          setStudent(next);
          setError("");
          setSuccess("");
        }}
        disabled={busy}
      />

      <StudentSearchResult student={student} />

      {student && isAlreadyActive ? (
        <PermissionNotice title="Already a member">
          {alreadyActiveMessage(existingRole)}
        </PermissionNotice>
      ) : null}

      {student && isInactive ? (
        <PermissionNotice title="Inactive membership">
          This student has an inactive membership. You can reactivate them with
          an allowed role if your permissions permit it.
        </PermissionNotice>
      ) : null}

      {student && !isAlreadyActive ? (
        <>
          <Select
            id="add-member-role"
            label="Club role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            required
            disabled={busy || !lookupAvailable}
          >
            {addableRoles.map((option) => (
              <option key={option} value={option}>
                {getClubRoleLabel(option)}
              </option>
            ))}
          </Select>

          <div className="button-row">
            {isInactive ? (
              <button
                type="button"
                className="button button--primary"
                disabled={busy || !lookupAvailable}
                onClick={() => handleAdd(role)}
              >
                {busy ? <Spinner size="sm" label="Reactivating" /> : null}
                Reactivate Membership
              </button>
            ) : (
              <>
                {addableRoles.includes("MEMBER") ? (
                  <button
                    type="button"
                    className="button button--primary"
                    disabled={busy || !lookupAvailable}
                    onClick={() => handleAdd("MEMBER")}
                  >
                    {busy ? <Spinner size="sm" label="Adding" /> : null}
                    Add as Member
                  </button>
                ) : null}
                {addableRoles.includes("EXEC") ? (
                  <button
                    type="button"
                    className="button button--secondary"
                    disabled={busy || !lookupAvailable}
                    onClick={() => handleAdd("EXEC")}
                  >
                    {busy ? <Spinner size="sm" label="Adding" /> : null}
                    Add as Executive
                  </button>
                ) : null}
              </>
            )}
          </div>
        </>
      ) : null}

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {success ? (
        <div className="alert alert--success" role="status">
          <strong>Success</strong>
          <p>{success}</p>
        </div>
      ) : null}

      <div className="badge-row">
        {addableRoles.map((option) => (
          <ClubRoleBadge key={option} role={option} />
        ))}
      </div>
    </section>
  );
}
