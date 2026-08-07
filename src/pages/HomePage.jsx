import { useCallback, useEffect, useState } from "react";
import { HomeDayWeatherPanel } from "../components/HomeDayWeatherPanel";
import { HomepageAnnouncements } from "../components/HomepageAnnouncements";
import { ErrorMessage } from "../components/ErrorMessage";
import { Spinner } from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { getEffectiveSchoolDay } from "../services/schoolDay";
import { getMississaugaWeather } from "../services/weather";
import { displayName } from "../utils/format";
import { getErrorMessage } from "../utils/errors";
import {
  getTorontoTodayYmd,
  msUntilNextTorontoMidnight,
} from "../utils/torontoDate";
import { Link } from "react-router-dom";

export function HomePage() {
  const {
    user,
    profile,
    isAuthenticated,
    canAccessExecDashboard,
    canCreateAnnouncements,
    accessDenied,
    authError,
    signInWithGoogle,
  } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [localError, setLocalError] = useState("");

  const [schoolDay, setSchoolDay] = useState(null);
  const [schoolDayLoading, setSchoolDayLoading] = useState(true);
  const [schoolDayError, setSchoolDayError] = useState("");
  const [torontoDateKey, setTorontoDateKey] = useState(() =>
    getTorontoTodayYmd(),
  );

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");

  const loadSchoolDay = useCallback(async () => {
    setSchoolDayLoading(true);
    setSchoolDayError("");
    try {
      const data = await getEffectiveSchoolDay();
      setSchoolDay(data);
      if (data?.toronto_date) {
        setTorontoDateKey(data.toronto_date);
      }
    } catch (error) {
      setSchoolDayError(
        getErrorMessage(error, "Could not load today’s school day."),
      );
      setSchoolDay(null);
    } finally {
      setSchoolDayLoading(false);
    }
  }, []);

  const loadWeather = useCallback(async ({ force = false } = {}) => {
    setWeatherLoading(true);
    setWeatherError("");
    try {
      const data = await getMississaugaWeather({ force });
      setWeather(data);
      if (data.stale) {
        setWeatherError(data.staleError || "Weather refresh failed.");
      }
    } catch (error) {
      setWeather(null);
      setWeatherError(getErrorMessage(error, "Weather unavailable."));
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchoolDay();
  }, [loadSchoolDay, torontoDateKey]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  // Refresh effective day at Toronto midnight (and every minute as a safety net).
  useEffect(() => {
    let midnightTimer = null;
    let pollTimer = null;

    function scheduleMidnightRefresh() {
      window.clearTimeout(midnightTimer);
      midnightTimer = window.setTimeout(() => {
        setTorontoDateKey(getTorontoTodayYmd());
        scheduleMidnightRefresh();
      }, msUntilNextTorontoMidnight());
    }

    scheduleMidnightRefresh();
    pollTimer = window.setInterval(() => {
      const today = getTorontoTodayYmd();
      setTorontoDateKey((current) => (current === today ? current : today));
    }, 60_000);

    return () => {
      window.clearTimeout(midnightTimer);
      window.clearInterval(pollTimer);
    };
  }, []);

  // Refresh weather periodically and when the tab regains focus.
  useEffect(() => {
    const interval = window.setInterval(() => {
      loadWeather({ force: true });
    }, 20 * 60 * 1000);

    function handleFocus() {
      loadWeather({ force: false });
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") handleFocus();
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadWeather]);

  async function handleSignIn() {
    setSigningIn(true);
    setLocalError("");

    try {
      await signInWithGoogle();
    } catch (error) {
      setLocalError(getErrorMessage(error, "Google sign-in failed."));
      setSigningIn(false);
    }
  }

  const name = displayName(profile, user);

  return (
    <div className="page home-page">
      <section className="hero-panel hero-panel--compact">
        <p className="eyebrow">John Fraser SS</p>
        <h1>John Fraser SAC</h1>
        <p className="lede">
          {isAuthenticated
            ? `Welcome back, ${name}. Stay up to date with published announcements.`
            : "Official announcements from the John Fraser Student Activity Council."}
        </p>

        {(accessDenied || authError || localError) && (
          <ErrorMessage title="Access denied">
            {localError || authError}
          </ErrorMessage>
        )}

        <div className="button-row">
          {!isAuthenticated ? (
            <button
              type="button"
              className="button button--primary"
              onClick={handleSignIn}
              disabled={signingIn}
            >
              {signingIn ? (
                <>
                  <Spinner size="sm" label="Redirecting" /> Redirecting…
                </>
              ) : (
                "Continue with Google"
              )}
            </button>
          ) : (
            <Link to="/dashboard" className="button button--primary">
              Open profile
            </Link>
          )}
          <Link to="/clubs" className="button button--secondary">
            Explore clubs
          </Link>
          {isAuthenticated && canCreateAnnouncements ? (
            <Link to="/announcements/new" className="button button--secondary">
              Create announcement
            </Link>
          ) : null}
          {isAuthenticated && canAccessExecDashboard ? (
            <Link to="/exec-dashboard" className="button button--secondary">
              Exec Dashboard
            </Link>
          ) : null}
        </div>
      </section>

      <HomeDayWeatherPanel
        schoolDay={schoolDay}
        schoolDayLoading={schoolDayLoading}
        schoolDayError={schoolDayError}
        weather={weather}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
      />

      <HomepageAnnouncements limit={5} />
    </div>
  );
}
