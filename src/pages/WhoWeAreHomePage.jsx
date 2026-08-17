import { Link } from "react-router-dom";

const sacPresidents = [
  { id: "arshaan", name: "Arshaan Thind", role: "Co-President" },
  { id: "amrita", name: "Amrita Rajaram", role: "Co-President" },
];

const groupPhoto = null; // set to e.g. "/images/hamza-david-group.jpg" once you have it

export function HomeWhoWeAre() {
  return (
    <section className="panel who-we-are" aria-labelledby="who-we-are-heading">
      <div className="who-we-are__top">
        <div className="who-we-are__photo">
          {groupPhoto ? (
            <img src={groupPhoto} alt="Hamza Saleh and David Chen" />
          ) : (
            <div className="who-we-are__photo-placeholder">
              Photo coming soon
            </div>
          )}
        </div>

        <div className="who-we-are__intro">
          <p className="eyebrow">Who we are</p>
          <h2 id="who-we-are-heading">About SAC</h2>
          <p className="lede">
            SAC stands for Student Activity Council. We're a team of John
            Fraser students committed to enhancing your high school
            experience through a diverse array of events. Learn more about
            what we do and how you can get involved.
          </p>
        </div>
      </div>

      <div className="officer-row">
        <div className="officer-list">
          {sacPresidents.map((officer) => (
            <div key={officer.id} className="officer-list__item">
              <p className="officer-list__name">{officer.name}</p>
              <p className="officer-list__role">{officer.role}</p>
            </div>
          ))}
        </div>

        <Link
          to="/our-team"
          className="btn-meet-team"
          onClick={() => window.scrollTo(0, 0)}
        >
          Meet the Team
        </Link>
      </div>
    </section>
  );
}