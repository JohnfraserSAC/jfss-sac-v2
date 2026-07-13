import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AddClubMemberDialog } from "../components/AddClubMemberDialog";
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
import { getClubBySlug } from "../services/clubs";
import {
  getClubMemberships,
  getCurrentUserClubMembership,
  probeProfileSearchAvailability,
} from "../services/memberships";
import {
  canManageClubMembers,
  getAddableRoles,
  getClubRoleLabel,
} from "../utils/clubPermissions";
import { getErrorMessage } from "../utils/errors";

export function ClubManagePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isSacAdmin, isSiteAdmin, isAdmin } = useAuth();

  const [club, setClub] = useState(null);
  const [membership, setMembership] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [profilesWarning, setProfilesWarning] = useState(null);
  const [searchAvailable, setSearchAvailable] = useState(false);
  const [searchWarning, setSearchWarning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
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
        return;
      }

      setClub(nextClub);

      const currentMembership = await getCurrentUserClubMembership(
        nextClub.id,
        user.id,
      );
      setMembership(currentMembership);

      const allowed = canManageClubMembers({
        clubRole: currentMembership?.role,
        isSacAdmin,
        isSiteAdmin,
      });

      if (!allowed) {
        setUnauthorized(true);
        return;
      }

      const [membershipResult, searchProbe] = await Promise.all([
        getClubMemberships(nextClub.id),
        probeProfileSearchAvailability(),
      ]);

      setMemberships(membershipResult.memberships);
      setProfilesWarning(membershipResult.profilesWarning);
      setSearchAvailable(searchProbe.searchAvailable);
      setSearchWarning(searchProbe.warning);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load club management."));
    } finally {
      setLoading(false);
    }
  }, [slug, user.id, isSacAdmin, isSiteAdmin]);

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

  const addableRoles = getAddableRoles({
    currentUserRole: membership?.role,
    isSacAdmin,
    isSiteAdmin,
  });

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
            Manage club-scoped memberships for this club. Roles stay in{" "}
            <code>club_memberships</code>, not global system roles.
          </p>
        </div>
        <Link className="text-link" to={`/clubs/${club.slug}`}>
          View club page
        </Link>
      </header>

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
              Application admin
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
            OWNER memberships are protected from normal role changes and
            removal.
          </li>
        </ul>
      </section>

      {profilesWarning ? (
        <PermissionNotice title="Profile visibility limited">
          {profilesWarning}
        </PermissionNotice>
      ) : null}

      {searchWarning ? (
        <PermissionNotice title="Student search limited">
          {searchWarning}
        </PermissionNotice>
      ) : null}

      {success ? (
        <div className="alert alert--success" role="status">
          <strong>Success</strong>
          <p>{success}</p>
        </div>
      ) : null}

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <section className="panel">
        <div className="section-heading">
          <h2>Members</h2>
          {addableRoles.length > 0 ? (
            <button
              type="button"
              className="button button--primary"
              onClick={() => setAddOpen(true)}
            >
              Add member
            </button>
          ) : null}
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
          isSiteAdmin={isSiteAdmin}
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

      <AddClubMemberDialog
        open={addOpen}
        club={club}
        currentUserId={user.id}
        currentUserRole={membership?.role}
        isSacAdmin={isSacAdmin}
        isSiteAdmin={isSiteAdmin}
        existingUserIds={memberships.map((row) => row.user_id)}
        searchAvailable={searchAvailable}
        searchWarning={searchWarning}
        onClose={() => setAddOpen(false)}
        onSuccess={({ label, role }) => {
          setSuccess(
            `Added ${label} as ${getClubRoleLabel(role)} of ${club.name}.`,
          );
          loadPage();
        }}
      />

      <ChangeRoleDialog
        open={Boolean(changeTarget)}
        membership={changeTarget}
        clubName={club.name}
        currentUserRole={membership?.role}
        isSacAdmin={isSacAdmin}
        isSiteAdmin={isSiteAdmin}
        onClose={() => setChangeTarget(null)}
        onSuccess={({ label, role }) => {
          setSuccess(
            `Updated ${label} to ${getClubRoleLabel(role)} for ${club.name}.`,
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
        onSuccess={({ label, isSelf }) => {
          setSuccess(
            isSelf
              ? `You left ${club.name}.`
              : `Removed ${label} from ${club.name}.`,
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
