import { useEffect, useState } from "react";
import { TextInput } from "./FormField";
import { Spinner } from "./Spinner";
import { searchEligibleStudents } from "../services/memberships";
import { getErrorMessage } from "../utils/errors";

export function MemberSearchInput({
  onSelect,
  selectedUser,
  disabled = false,
  excludeUserIds = [],
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (disabled) return undefined;

    const handle = window.setTimeout(async () => {
      const trimmed = term.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setWarning("");
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await searchEligibleStudents(trimmed);
        const filtered = (response.results || []).filter(
          (profile) => !excludeUserIds.includes(profile.id),
        );
        setResults(filtered);
        setWarning(response.warning || "");
      } catch (searchError) {
        setResults([]);
        setError(getErrorMessage(searchError, "Could not search students."));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [term, disabled, excludeUserIds]);

  if (disabled) {
    return null;
  }

  return (
    <div className="member-search">
      <TextInput
        id="member-search"
        label="Search students"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Search by name or email"
        hint="Select a student from the results."
      />

      {loading ? (
        <p className="muted">
          <Spinner size="sm" label="Searching" /> Searching…
        </p>
      ) : null}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {warning ? <p className="form-hint">{warning}</p> : null}

      {selectedUser ? (
        <p className="selected-member">
          Selected:{" "}
          <strong>
            {selectedUser.full_name || selectedUser.email || selectedUser.id}
          </strong>
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="member-search__results">
          {results.map((profile) => (
            <li key={profile.id}>
              <button
                type="button"
                className="member-search__result"
                onClick={() => onSelect?.(profile)}
              >
                <strong>{profile.full_name || "Unnamed student"}</strong>
                <span>{profile.email}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
