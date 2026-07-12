import { useCallback, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const ALLOWED_DOMAIN = "pdsb.net";

function getEmailDomain(email) {
  return email?.trim().toLowerCase().split("@").pop() ?? "";
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  const loadDatabaseData = useCallback(async (currentUser) => {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, avatar_url, graduation_year, is_active, created_at",
      )
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Profile query failed: ${profileError.message}`);
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_system_roles")
      .select(
        `
        assigned_at,
        expires_at,
        system_roles (
          code,
          name
        )
      `,
      )
      .eq("user_id", currentUser.id);

    if (roleError) {
      throw new Error(`Role query failed: ${roleError.message}`);
    }

    setProfile(profileData);
    setRoles(roleData ?? []);
  }, []);

  const processUser = useCallback(
    async (currentUser) => {
      setError("");

      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setRoles([]);
        setLoading(false);
        return;
      }

      /*
       * This is a client-side backup check.
       * Your Supabase Before User Created hook must remain
       * the real registration restriction.
       */
      if (getEmailDomain(currentUser.email) !== ALLOWED_DOMAIN) {
        await supabase.auth.signOut();

        setUser(null);
        setProfile(null);
        setRoles([]);
        setError("Only @pdsb.net Google accounts may access this application.");
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        await loadDatabaseData(currentUser);
      } catch (databaseError) {
        setError(
          databaseError instanceof Error
            ? databaseError.message
            : "Unknown database error",
        );
      } finally {
        setLoading(false);
      }
    },
    [loadDatabaseData],
  );

  useEffect(() => {
    let active = true;

    async function initialize() {
      setLoading(true);

      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      await processUser(currentUser);
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (active) {
          processUser(session?.user ?? null);
        }
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [processUser]);

  async function signInWithGoogle() {
    setSigningIn(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (signInError) {
      setError(signInError.message);
      setSigningIn(false);
    }
  }

  async function signOut() {
    setError("");

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    setUser(null);
    setProfile(null);
    setRoles([]);
  }

  async function retestDatabase() {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      await loadDatabaseData(user);
    } catch (databaseError) {
      setError(
        databaseError instanceof Error
          ? databaseError.message
          : "Unknown database error",
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          Checking authentication and database…
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <p style={styles.eyebrow}>John Fraser SAC</p>
        <h1>Supabase Authentication Test</h1>

        {error && (
          <div role="alert" style={styles.error}>
            <strong>Error</strong>
            <p>{error}</p>
          </div>
        )}

        {!user ? (
          <section style={styles.card}>
            <h2>Not signed in</h2>

            <p>Use your PDSB Google account to continue.</p>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={signingIn}
              style={styles.primaryButton}
            >
              {signingIn ? "Redirecting to Google…" : "Continue with Google"}
            </button>
          </section>
        ) : (
          <div style={styles.stack}>
            <section style={styles.card}>
              <div style={styles.headerRow}>
                <div>
                  <p style={styles.success}>Authentication successful</p>
                  <h2>{user.email}</h2>
                </div>

                <button
                  type="button"
                  onClick={signOut}
                  style={styles.secondaryButton}
                >
                  Sign out
                </button>
              </div>

              <DataRow label="Auth user ID" value={user.id} />
              <DataRow
                label="Provider"
                value={user.app_metadata?.provider ?? "Unknown"}
              />
              <DataRow
                label="Email domain"
                value={getEmailDomain(user.email)}
              />
            </section>

            <section style={styles.card}>
              <h2>Database profile</h2>

              <p style={profile ? styles.success : styles.warning}>
                {profile ? "Profile found" : "Profile missing"}
              </p>

              {profile && (
                <>
                  <DataRow label="Profile ID" value={profile.id} />
                  <DataRow label="Email" value={profile.email} />
                  <DataRow label="Full name" value={profile.full_name} />
                  <DataRow
                    label="Auth and profile IDs match"
                    value={profile.id === user.id ? "Yes" : "No"}
                  />
                  <DataRow
                    label="Active"
                    value={profile.is_active ? "Yes" : "No"}
                  />
                </>
              )}
            </section>

            <section style={styles.card}>
              <h2>System roles</h2>

              {roles.length === 0 ? (
                <p>No roles assigned. This is normal for a new student.</p>
              ) : (
                <pre style={styles.pre}>{JSON.stringify(roles, null, 2)}</pre>
              )}
            </section>

            <button
              type="button"
              onClick={retestDatabase}
              style={styles.secondaryButton}
            >
              Retest database connection
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function DataRow({ label, value }) {
  return (
    <div style={styles.dataRow}>
      <strong>{label}</strong>
      <span>{String(value ?? "Not available")}</span>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#09090b",
    color: "#fafafa",
    padding: "48px 20px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "760px",
    margin: "0 auto",
  },
  eyebrow: {
    color: "#a1a1aa",
    fontWeight: 700,
  },
  stack: {
    display: "grid",
    gap: "20px",
    marginTop: "24px",
  },
  card: {
    marginTop: "20px",
    padding: "24px",
    border: "1px solid #27272a",
    borderRadius: "16px",
    background: "#18181b",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
  },
  dataRow: {
    display: "grid",
    gridTemplateColumns: "200px 1fr",
    gap: "16px",
    padding: "12px 0",
    borderBottom: "1px solid #27272a",
    overflowWrap: "anywhere",
  },
  primaryButton: {
    marginTop: "16px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryButton: {
    padding: "10px 14px",
    border: "1px solid #52525b",
    borderRadius: "8px",
    background: "transparent",
    color: "#fafafa",
    cursor: "pointer",
  },
  success: {
    color: "#4ade80",
    fontWeight: 700,
  },
  warning: {
    color: "#fbbf24",
    fontWeight: 700,
  },
  error: {
    marginTop: "20px",
    padding: "16px",
    border: "1px solid #991b1b",
    borderRadius: "10px",
    background: "#450a0a",
    color: "#fecaca",
  },
  pre: {
    overflowX: "auto",
    padding: "16px",
    borderRadius: "8px",
    background: "#09090b",
  },
};
