const athletesOfTheMonth = [
  {
    name: "Person 1",
    sport: "Basketball",
    photo: null,
    initials: "AO",
    color: "#1e2a4a",
  },
  {
    name: "Person 2",
    sport: "Soccer",
    photo: null,
    initials: "LC",
    color: "#2c5eb0",
  },
  {
    name: "Person 3",
    sport: "Badminton",
    photo: null,
    initials: "PN",
    color: "#1a7a5e",
  },
  {
    name: "Person 4",
    sport: "Cricket",
    photo: null,
    initials: "EP",
    color: "#6b3fa0",
  },
  {
    name: "Person 5",
    sport: "Volleyball",
    photo: null,
    initials: "SM",
    color: "#b5651d",
  },
];

const sportsTeams = [
  {
    name: "Basketball",
    icon: "🏀",
    description:
      "Fast-paced, competitive, and one of the most popular teams at John Fraser. Tryouts run in the fall for junior and senior squads.",
  },
  {
    name: "Soccer",
    icon: "⚽",
    description:
      "Boys' and girls' teams compete throughout the season with regular practices and league games against other schools.",
  },
  {
    name: "Volleyball",
    icon: "🏐",
    description:
      "A high-energy team sport with junior and senior divisions, known for strong school spirit and a packed gym on game days.",
  },
  {
    name: "Swim",
    icon: "🏊",
    description:
      "Competitive swimmers race in individual and relay events, representing John Fraser at regional and provincial swim meets.",
  },
  {
    name: "Cricket",
    icon: "🏏",
    description:
      "A growing team at John Fraser, cricket brings fierce competition, big personalities, and an electric atmosphere every match day.",
  },
  {
    name: "Tennis",
    icon: "🎾",
    description:
      "Singles and doubles players compete in a fast-paced season, with tryouts open to all skill levels.",
  },
  {
    name: "Badminton",
    icon: "🏸",
    description:
      "One of the school's most competitive teams, with singles and doubles play across multiple skill divisions.",
  },
  {
    name: "Ultimate Frisbee",
    icon: "🥏",
    description:
      "A fast, fun, self-refereed sport built on sportsmanship and teamwork — open to players of any experience level.",
  },
  {
    name: "Rugby",
    icon: "🏉",
    description:
      "A physical, team-first sport that builds toughness and camaraderie through a demanding competitive season.",
  },
  {
    name: "Cross Country",
    icon: "🏃",
    description:
      "Distance runners take on tough courses each fall, building endurance and mental toughness meet after meet.",
  },
  {
    name: "Golf",
    icon: "⛳",
    description:
      "Individual competitors represent John Fraser at regional tournaments throughout the fall season.",
  },
  {
    name: "Table Tennis",
    icon: "🏓",
    description:
      "Quick reflexes and precision define this team, with singles and doubles competition open to all grades.",
  },
];

function AthleteCard({ athlete }) {
  return (
    <div className="athlete-card">
      {athlete.photo ? (
        <img
          src={athlete.photo}
          alt={athlete.name}
          className="athlete-card__photo"
        />
      ) : (
        <div
          className="athlete-card__photo athlete-card__photo--placeholder"
          style={{ backgroundColor: athlete.color }}
        >
          {athlete.initials}
        </div>
      )}
      <h3 className="athlete-card__name">{athlete.name}</h3>
      <p className="athlete-card__sport">{athlete.sport}</p>
    </div>
  );
}

function SportCard({ team }) {
  return (
    <div className="sport-card">
      <div className="sport-card__icon" aria-hidden="true">
        {team.icon}
      </div>
      <h3 className="sport-card__name">{team.name}</h3>
      <p className="sport-card__description">{team.description}</p>
    </div>
  );
}

export function SportsPage() {
  return (
    <div className="team-page">
      <div className="team-header">
        <h1 className="team-title">Fraser's Sports Teams</h1>
        <p className="team-subtitle">
          Every competitive team John Fraser has to offer, all in one place.
        </p>
      </div>

      <div className="section-header">
        <h2 className="section-header__title">Athlete of the Month</h2>
        <p className="section-header__subtitle">
          Celebrating standout performances across our teams throughout the year.
        </p>
      </div>

      <div className="athlete-grid">
        {athletesOfTheMonth.map((athlete) => (
          <AthleteCard key={athlete.name} athlete={athlete} />
        ))}
      </div>

      <div className="section-header">
        <h2 className="section-header__title">Our Teams</h2>
      </div>

      <div className="sport-grid">
        {sportsTeams.map((team) => (
          <SportCard key={team.name} team={team} />
        ))}
      </div>
    </div>
  );
}