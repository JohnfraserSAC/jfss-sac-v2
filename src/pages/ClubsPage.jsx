import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ClubCard } from "../components/clubs/ClubCard";
import { ClubGridSkeleton } from "../components/clubs/ClubGridSkeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { TextInput } from "../components/ui/TextInput";
import { getApprovedClubs } from "../services/clubs";
import { getConfirmedClubPromoLunchClubIds } from "../services/clubPromoLunch";
import {
  CLUB_EXPLORE_MOBILE_QUERY,
  getClubExplorePageSize,
} from "../utils/clubExplore";
import { getErrorMessage } from "../utils/errors";

function readClubExplorePageSize() {
  if (typeof window === "undefined") {
    return getClubExplorePageSize(false);
  }
  return getClubExplorePageSize(
    window.matchMedia(CLUB_EXPLORE_MOBILE_QUERY).matches,
  );
}

export function ClubsPage() {
  const location = useLocation();
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState("");
  const [promoLunchOnly, setPromoLunchOnly] = useState(false);
  const [promoLunchClubIds, setPromoLunchClubIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || "");
  const [pageSize, setPageSize] = useState(readClubExplorePageSize);
  const [visibleByFilter, setVisibleByFilter] = useState(() => ({
    key: "",
    count: readClubExplorePageSize(),
  }));
  const loadMoreRef = useRef(null);
  const loadMoreCooldownRef = useRef(0);

  useEffect(() => {
    if (location.state?.notice) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- consume navigation feedback
      setNotice(location.state.notice);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const media = window.matchMedia(CLUB_EXPLORE_MOBILE_QUERY);
    function syncPageSize() {
      setPageSize(getClubExplorePageSize(media.matches));
    }
    syncPageSize();
    media.addEventListener("change", syncPageSize);
    return () => media.removeEventListener("change", syncPageSize);
  }, []);

  const loadClubs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [data, confirmedClubIds] = await Promise.all([
        getApprovedClubs(),
        getConfirmedClubPromoLunchClubIds(),
      ]);
      setClubs(data);
      setPromoLunchClubIds(confirmedClubIds);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load clubs."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional async clubs fetch
    loadClubs();
  }, [loadClubs]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clubs.filter((club) => {
      if (promoLunchOnly && !promoLunchClubIds.has(club.id)) return false;
      if (!query) return true;
      const haystack = [
        club.name,
        club.description,
        club.short_description,
        club.instagram_handle,
        club.contact_email,
        club.meeting_location,
        club.meeting_schedule,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [clubs, promoLunchClubIds, promoLunchOnly, search]);

  const filterKey = `${promoLunchOnly ? "1" : "0"}:${search}:${pageSize}`;
  if (visibleByFilter.key !== filterKey) {
    setVisibleByFilter({ key: filterKey, count: pageSize });
  }

  const visibleCount =
    visibleByFilter.key === filterKey ? visibleByFilter.count : pageSize;
  const visibleClubs = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const remaining = Math.max(filtered.length - visibleCount, 0);
  const nextCount = Math.min(pageSize, remaining);

  const loadMore = useCallback(() => {
    const now = Date.now();
    if (now - loadMoreCooldownRef.current < 400) return;
    loadMoreCooldownRef.current = now;
    setVisibleByFilter((current) => ({
      key: filterKey,
      count:
        current.key === filterKey ? current.count + pageSize : pageSize * 2,
    }));
  }, [filterKey, pageSize]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: "160px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div className="page">
      <div className="toolbar clubs-toolbar">
        <button
          type="button"
          className={`promo-lunch-filter${promoLunchOnly ? " promo-lunch-filter--active" : ""}`}
          aria-pressed={promoLunchOnly}
          disabled={loading}
          onClick={() => setPromoLunchOnly((active) => !active)}
        >
          {promoLunchOnly
            ? "Clubs confirmed for Club Promo Lunch"
            : "See clubs confirmed for Club Promo Lunch"}
        </button>
        <TextInput
          id="club-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by club name"
          disabled={loading}
        />
      </div>

      {notice ? (
        <div className="alert alert--success" role="status">
          <strong>Success</strong>
          <p>{notice}</p>
        </div>
      ) : null}

      {error ? (
        <div className="stack">
          <ErrorMessage>{error}</ErrorMessage>
          <button
            type="button"
            className="button button--secondary"
            onClick={loadClubs}
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading ? <ClubGridSkeleton count={pageSize} /> : null}

      {!loading && !error && filtered.length === 0 ? (
        <EmptyState
          title="No clubs are currently available."
          action={
            <Link className="text-link" to="/">
              Back to home
            </Link>
          }
        >
          {search.trim()
            ? "No approved clubs match your search. Try a different name or clear the search."
            : promoLunchOnly
              ? "No clubs have been confirmed for Club Promo Lunch yet."
              : "There are no publicly active clubs to show right now. Check back after clubs are approved for this school year."}
        </EmptyState>
      ) : null}

      {!loading && !error && filtered.length > 0 ? (
        <>
          <div className="club-grid">
            {visibleClubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
          {hasMore ? (
            <div className="club-explore-more" ref={loadMoreRef}>
              <button
                type="button"
                className="button button--secondary"
                onClick={loadMore}
              >
                Load {nextCount} more {nextCount === 1 ? "club" : "clubs"}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
