import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AddClubMemberForm } from "../components/AddClubMemberForm";
import { ChangeRoleDialog } from "../components/ChangeRoleDialog";
import { ClubMemberList } from "../components/ClubMemberList";
import { ClubRoleBadge } from "../components/ClubRoleBadge";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { PermissionNotice } from "../components/PermissionNotice";
import { ClubDangerZone } from "../components/ClubDangerZone";
import { RemoveMemberDialog } from "../components/RemoveMemberDialog";
import { Select, TextInput } from "../components/FormField";
import { getClubAnnualState, getClubBySlug } from "../services/clubs";
import {
  getClubMemberships,
  getCurrentUserClubMembership,
  probeStudentLookupAvailability,
} from "../services/memberships";
import {
  canManageClubMembers,
  canSearchStudents,
  getAddableRoles,
  getClubRoleLabel,
  isClubLeader,
} from "../utils/clubPermissions";
import { getErrorMessage } from "../utils/errors";
import { formatDate } from "../utils/format";

function annualStatusLabel(status, overdue) {
  if (status === "PENDING_SUPERVISOR" && overdue) return "Supervisor Overdue";
  if (status === "PENDING_SUPERVISOR") return "Pending Supervisor";
  if (status === "ACTIVE") return "Active";
  if (status === "SUSPENDED") return "Suspended";
  if (status === "INACTIVE") return "Inactive";
  return status || "Unknown";
}

export function ClubManagePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isSacAdmin, isAdmin } = useAuth();

  const [club, setClub] = useState(null);
  const [annual, setAnnual] = useState(null);
  const [membership, setMembership] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [profilesWarning, setProfilesWarning] = useState(null);
  const [lookupAvailable, setLookupAvailable] = useState(false);
  const [lookupWarning, setLookupWarning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const [changeTarget, setChangeTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    setUnauthorized(false);

    try {
      const nextClub = await getClubBySlug(slug);
      if (!nextClub) {
        setClub(null);
        setMembership(null);
        setMemberships([]);
        setAnnual(null);
        return;
      }

      setClub(nextClub);

      const [currentMembership, annualState] = await Promise.all([
        getCurrentUserClubMembership(nextClub.id, user.id),
        getClubAnnualState(nextClub.id).catch(() => null),
      ]);
      setMembership(currentMembership);
      setAnnual(annualState);

      const allowed = canManageClubMembers({
        clubRole: currentMembership?.role,
        isSacAdmin,
      });

      if (!allowed) {
        setUnauthorized(true);
        return;
      }

      const [membershipResult, lookupProbe] = await Promise.all([
        getClubMemberships(nextClub.id),
        probeStudentLookupAvailability(),
      ]);

      setMemberships(membershipResult.memberships);
      setProfilesWarning(membershipResult.profilesWarning);
      setLookupAvailable(lookupProbe.available);
      setLookupWarning(lookupProbe.warning);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load club management."));
    } finally {
      setLoading(false);
    }
  }, [slug, user.id, isSacAdmin]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const filteredMemberships = useMemo(() => {
    const query = search.trim().toLowerCase();

    return memberships.filter((row) => {
      if (roleFilter !== "ALL" && row.role !== roleFilter) {
        return false;
      }

      if (!query) return true;

      const haystack = [
        row.profile?.full_name,
        row.profile?.email,
        row.user_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [memberships, roleFilter, search]);

  const activeOwnerCount = useMemo(
    () =>
      memberships.filter(
        (row) => row.role === "OWNER" && row.status === "ACTIVE",
      ).length,
    [memberships],
  );

  const addableRoles = getAddableRoles({
    currentUserRole: membership?.role,
    isSacAdmin,
    activeOwnerCount,
  });

  const canSearch = canSearchStudents({
    clubRole: membership?.role,
    isSacAdmin,
  });

  const isPendingSupervisor = annual?.status === "PENDING_SUPERVISOR";
  const isOverdue =
    isPendingSupervisor &&
    annual?.supervisor_due_at &&
    new Date(annual.supervisor_due_at).getTime() < Date.now();
  const operationsAllowed = annual?.status === "ACTIVE";
  if (loading) {
    return <LoadingScreen message="Loading club management…" />;
  }

  if (unauthorized && club) {
    return <Navigate to={`/clubs/${club.slug}`} replace />;
  }

  if (!club) {
    return (
      <div className="page">
        <EmptyState title="Club not found">
          This club does not exist or is not available.
        </EmptyState>
        <Link className="text-link" to="/clubs">
          Back to clubs
        </Link>
      </div>
    );
  }

  if (error && memberships.length === 0) {
    return (
      <div className="page">
        <ErrorMessage>{error}</ErrorMessage>
        <Link className="text-link" to={`/clubs/${club.slug}`}>
          Back to club
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Club management</p>
          <h1>{club.name}</h1>
          <p className="lede">
            Manage club profile and memberships. A club may have at most three
            active OWNERs.
          </p>
          <p>
            Annual status:{" "}
            <strong>
              {annualStatusLabel(annual?.status, isOverdue)}
            </strong>
            {isPendingSupervisor && annual?.supervisor_due_at ? (
              <>
                {" "}
                · Supervisor due {formatDate(annual.supervisor_due_at)}
              </>
            ) : null}
          </p>
          <p>
            {activeOwnerCount} of 3 Owners
          </p>
        </div>
        <Link className="text-link" to={`/clubs/${club.slug}`}>
          View club page
        </Link>
      </header>

      {isPendingSupervisor ? (
        <div className="alert alert--warning" role="status">
          <strong>
            {isOverdue ? "Supervisor requirement overdue" : "Pending supervisor"}
          </strong>
          <p>
            This club is not public in Explore. Announcements, event approvals,
            and funding requests stay blocked until SAC approves at least one
            teacher supervisor. Owners may still manage members and submit
            supervisor information.
          </p>
        </div>
      ) : null}

      <section className="panel">
        <h2>Your permissions</h2>
        <div className="badge-row">
          {membership?.role ? (
            <ClubRoleBadge role={membership.role} />
          ) : (
            <span className="muted">No club membership</span>
          )}
          {isAdmin ? (
            <span className="badge badge--role badge--role-sac-admin">
              SAC Admin
            </span>
          ) : null}
        </div>
        <ul className="dialog-list">
          <li>
            Your club role:{" "}
            {membership?.role
              ? getClubRoleLabel(membership.role)
              : "None (admin override)"}
          </li>
          <li>
            You can add:{" "}
            {addableRoles.length
              ? addableRoles.map(getClubRoleLabel).join(", ")
              : "No add permissions"}
          </li>
          <li>
            Owners: {activeOwnerCount} of 3. An OWNER may leave only when another
            OWNER remains. Only SAC_ADMIN may forcibly remove an OWNER.
          </li>
        </ul>
        {membership?.status === "ACTIVE" && isClubLeader(membership.role) ? (
          <div className="button-row" style={{ marginTop: "1rem" }}>
            {operationsAllowed ? (
              <>
                <Link
                  className="button button--primary"
                  to={`/clubs/${club.slug}/manage/event-requests/new`}
                >
                  Submit Event for Approval
                </Link>
                <Link
                  className="button button--secondary"
                  to={`/clubs/${club.slug}/manage/funding`}
                >
                  Club Funding Request
                </Link>
              </>
            ) : (
              <p className="muted">
                Event and funding requests unlock after the club is ACTIVE.
              </p>
            )}
          </div>
        ) : null}
      </section>

      {profilesWarning ? (
        <PermissionNotice title="Profile visibility limited">
          {profilesWarning}
        </PermissionNotice>
      ) : null}

      {success ? (
        <div className="alert alert--success" role="status">
          <strong>Success</strong>
          <p>{success}</p>
        </div>
      ) : null}

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      {canSearch && addableRoles.length > 0 ? (
        <AddClubMemberForm
          club={club}
          currentUserId={user.id}
          currentUserRole={membership?.role}
          isSacAdmin={isSacAdmin}
          existingMemberships={memberships}
          lookupAvailable={lookupAvailable}
          lookupWarning={lookupWarning}
          onSuccess={({ role }) => {
            setSuccess(
              role === "EXEC"
                ? "Student added as Executive."
                : "Student added as Member.",
            );
            loadPage();
          }}
        />
      ) : null}

      <section className="panel">
        <div className="section-heading">
          <h2>Members</h2>
        </div>

        <div className="toolbar toolbar--split">
          <Select
            id="membership-role-filter"
            label="Filter by role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="ALL">All roles</option>
            <option value="OWNER">Owner</option>
            <option value="EXEC">Executive</option>
            <option value="MEMBER">Member</option>
          </Select>

          <TextInput
            id="membership-search"
            label="Search members"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, or user ID"
          />
        </div>

        <ClubMemberList
          memberships={filteredMemberships}
          currentUserId={user.id}
          currentUserRole={membership?.role}
          isSacAdmin={isSacAdmin}
          onChangeRole={setChangeTarget}
          onRemove={setRemoveTarget}
        />
      </section>

      {isAdmin ? (
        <ClubDangerZone
          club={club}
          membershipCount={memberships.length}
          onArchived={(updated) => {
            setClub(updated);
            setSuccess(
              `${updated.name} was archived. It is hidden from the public clubs list, but memberships remain.`,
            );
          }}
          onRestored={(updated) => {
            setClub(updated);
            setSuccess(
              `${updated.name} was restored to APPROVED and is visible in the public clubs list again.`,
            );
          }}
          onDeleted={({ clubName }) => {
            setClub(null);
            setMembership(null);
            setMemberships([]);
            setSuccess(`${clubName} was permanently deleted.`);
            navigate("/clubs", {
              replace: true,
              state: {
                notice: `${clubName} was permanently deleted. Related club memberships were removed by cascade.`,
              },
            });
          }}
        />
      ) : null}

      <ChangeRoleDialog
        open={Boolean(changeTarget)}
        membership={changeTarget}
        clubName={club.name}
        currentUserRole={membership?.role}
        isSacAdmin={isSacAdmin}
        onClose={() => setChangeTarget(null)}
        onSuccess={({ role }) => {
          setSuccess(
            role === "EXEC"
              ? "Member promoted to Executive."
              : "Executive changed to Member.",
          );
          loadPage();
        }}
      />

      <RemoveMemberDialog
        open={Boolean(removeTarget)}
        membership={removeTarget}
        clubName={club.name}
        currentUserId={user.id}
        onClose={() => setRemoveTarget(null)}
        onSuccess={({ isSelf }) => {
          setSuccess(
            isSelf
              ? `You left ${club.name}.`
              : "Student removed from the club.",
          );
          if (isSelf && !isAdmin) {
            navigate(`/clubs/${club.slug}`, { replace: true });
            return;
          }
          loadPage();
        }}
      />
    </div>
  );
}
