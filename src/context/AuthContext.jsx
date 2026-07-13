import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import * as authService from "../services/auth";
import {
  getCurrentProfile,
  getCurrentUserSystemRoles,
} from "../services/profiles";
import { isAllowedEmailDomain } from "../utils/domain";
import { getErrorMessage } from "../utils/errors";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [systemRoles, setSystemRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [authError, setAuthError] = useState("");

  const clearSessionState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setSystemRoles([]);
  }, []);

  const refreshProfile = useCallback(async (userId) => {
    const id = userId ?? user?.id;
    if (!id) {
      setProfile(null);
      return null;
    }

    const nextProfile = await getCurrentProfile(id);
    setProfile(nextProfile);
    return nextProfile;
  }, [user?.id]);

  const refreshRoles = useCallback(async (userId) => {
    const id = userId ?? user?.id;
    if (!id) {
      setSystemRoles([]);
      return [];
    }

    const nextRoles = await getCurrentUserSystemRoles(id);
    setSystemRoles(nextRoles);
    return nextRoles;
  }, [user?.id]);

  const processUser = useCallback(
    async (currentUser) => {
      if (!currentUser) {
        clearSessionState();
        setIsLoading(false);
        return;
      }

      if (!isAllowedEmailDomain(currentUser.email)) {
        clearSessionState();
        setAccessDenied(true);
        setAuthError(
          "Only @pdsb.net Google accounts may access this application.",
        );
        setIsLoading(false);
        await authService.signOut();
        return;
      }

      setAccessDenied(false);
      setAuthError("");
      setUser(currentUser);

      let nextError = "";

      try {
        const nextProfile = await getCurrentProfile(currentUser.id);
        setProfile(nextProfile);
      } catch (profileError) {
        setProfile(null);
        nextError = getErrorMessage(
          profileError,
          "Could not load your profile.",
        );
      }

      try {
        const nextRoles = await getCurrentUserSystemRoles(currentUser.id);
        setSystemRoles(nextRoles);
      } catch (rolesError) {
        setSystemRoles([]);
        const rolesMessage = getErrorMessage(
          rolesError,
          "Could not load your system roles.",
        );
        nextError = nextError ? `${nextError} ${rolesMessage}` : rolesMessage;
      }

      if (nextError) {
        setAuthError(nextError);
      }

      setIsLoading(false);
    },
    [clearSessionState],
  );

  useEffect(() => {
    let active = true;

    async function initialize() {
      setIsLoading(true);

      try {
        const currentUser = await authService.getCurrentUser();
        if (!active) return;
        await processUser(currentUser);
      } catch (error) {
        if (!active) return;
        setAuthError(getErrorMessage(error, "Authentication failed."));
        clearSessionState();
        setIsLoading(false);
      }
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
  }, [clearSessionState, processUser]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError("");
    setAccessDenied(false);
    await authService.signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    setAuthError("");
    setAccessDenied(false);
    await authService.signOut();
    clearSessionState();
  }, [clearSessionState]);

  const roleCodes = useMemo(
    () => systemRoles.map((role) => role.code),
    [systemRoles],
  );

  const isSacAdmin = roleCodes.includes("SAC_ADMIN");
  const isSiteAdmin = roleCodes.includes("SITE_ADMIN");
  const isAdmin = isSacAdmin || isSiteAdmin;

  const value = useMemo(
    () => ({
      user,
      profile,
      systemRoles,
      isAuthenticated: Boolean(user),
      isLoading,
      isSacAdmin,
      isSiteAdmin,
      isAdmin,
      accessDenied,
      authError,
      signInWithGoogle,
      signOut,
      refreshProfile,
      refreshRoles,
      setAuthError,
    }),
    [
      user,
      profile,
      systemRoles,
      isLoading,
      isSacAdmin,
      isSiteAdmin,
      isAdmin,
      accessDenied,
      authError,
      signInWithGoogle,
      signOut,
      refreshProfile,
      refreshRoles,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
