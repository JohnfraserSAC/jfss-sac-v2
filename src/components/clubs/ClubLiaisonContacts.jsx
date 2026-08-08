import { CLUB_LIAISONS } from "../../config/clubApplications";

export function ClubLiaisonContacts() {
  return (
    <section className="panel">
      <h2>Club liaisons</h2>
      <p className="muted">
        If you have any questions, please contact our club liaisons:
      </p>
      <ul className="dialog-list">
        {CLUB_LIAISONS.map((person) => (
          <li key={person.email}>
            <strong>{person.name}</strong>
            <br />
            Email:{" "}
            <a className="text-link" href={`mailto:${person.email}`}>
              {person.email}
            </a>
            <br />
            Instagram: {person.instagram}
          </li>
        ))}
      </ul>
    </section>
  );
}
