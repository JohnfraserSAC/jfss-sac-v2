const execTeam = [
  { name: "Arshaan Thind", role: "Co-President", grade: "Grade 12", initials: "AT", color: "#1e2a4a", photo: null },
  { name: "Amrita Rajaram", role: "Co-President", grade: "Grade 12", initials: "AR", color: "#2c5eb0", photo: null },
  { name: "Himaja Pothuneedi", role: "Secretary", grade: "Grade 11", initials: "HP", color: "#1a7a5e", photo: null },
  { name: "Kirat Chopra", role: "Treasurer", grade: "Grade 11", initials: "KC", color: "#6b3fa0", photo: null },
  { name: "Cayden Janjua", role: "Social Convenor", grade: "Grade 11", initials: "CJ", color: "#2d6b8f", photo: null },
  { name: "Eshaal Cheema", role: "Clubs Liason", grade: "Grade 12", initials: "EC", color: "#b5651d", photo: null },
  { name: "Rasleen Kaur", role: "Clubs Liason", grade: "Grade 12", initials: "RK", color: "#2f4b9e", photo: null },
  { name: "Harshad Mahajan", role: "Technology Liason", grade: "Grade 12", initials: "HM", color: "#5c2d82", photo: null },
  { name: "Jason Chou", role: "Technology Liason", grade: "Grade 12", initials: "JC", color: "#1a7a5e", photo: null },
  { name: "Navya Shrivastava", role: "General Executive", grade: "Grade 12", initials: "NS", color: "#6b3fa0", photo: null },
  { name: "Eshal Khan", role: "General Executive", grade: "Grade 11", initials: "EK", color: "#2d6b8f", photo: null },
  { name: "Yasmine Avery D'Elia", role: "Atheletics Liason", grade: "Grade 12", initials: "YD", color: "#b5651d", photo: null },
  { name: "Arhum Saleem", role: "Arts Liason", grade: "Grade 11", initials: "AS", color: "#2f4b9e", photo: null },
  { name: "Noah Lee", role: "Community Outreach", grade: "Grade 11", initials: "NL", color: "#5c2d82", photo: null },
  { name: "Justin Deng", role: "Photography Executive", grade: "Grade 12", initials: "JD", color: "#6b3fa0", photo: null },
  { name: "Awinah Shah", role: "Photography Executive", grade: "Grade 12", initials: "AS", color: "#2d6b8f", photo: null },
  { name: "Inaya Afzal", role: "Promotions Officer", grade: "Grade 12", initials: "IA", color: "#b5651d", photo: null },
  { name: "Alissa Roy", role: "Promotions Officer", grade: "Grade 10", initials: "AR", color: "#2f4b9e", photo: null },
];

const gradeRepresentatives = [
  { name: "Person 1", role: "Grade Rep", grade: "Grade 9", initials: "P1", color: "#1e2a4a", photo: null },
  { name: "Person 2", role: "Grade Rep", grade: "Grade 10", initials: "P2", color: "#2c5eb0", photo: null },
  { name: "Person 3", role: "Grade Rep", grade: "Grade 11", initials: "P3", color: "#1a7a5e", photo: null },
  { name: "Person 4", role: "Grade Rep", grade: "Grade 12", initials: "P4", color: "#6b3fa0", photo: null },
]

const generalMembers = [
  { name: "Aaliya Noor", role: "Honourary", grade: "Grade 11", initials: "AN", color: "#1e2a4a", photo: null },
  { name: "Ben Kowalski", role: "Honourary", grade: "Grade 11", initials: "BK", color: "#2c5eb0", photo: null },
  { name: "Chloe Yuen", role: "Honourary", grade: "Grade 10", initials: "CY", color: "#1a7a5e", photo: null },
  { name: "Dmitri Sousa", role: "Honourary", grade: "Grade 11", initials: "DS", color: "#6b3fa0", photo: null },
  { name: "Elena Patel", role: "Honourary", grade: "Grade 10", initials: "EP", color: "#2d6b8f", photo: null },
  { name: "Finn McLaren", role: "Honourary", grade: "Grade 11", initials: "FM", color: "#b5651d", photo: null },
  { name: "Grace Ito", role: "Honourary", grade: "Grade 10", initials: "GI", color: "#2f4b9e", photo: null },
  { name: "Haruto Chen", role: "Honourary", grade: "Grade 11", initials: "HC", color: "#1e2a4a", photo: null },
  { name: "Isabel Reyes", role: "Honourary", grade: "Grade 10", initials: "IR", color: "#5c2d82", photo: null },
  { name: "Jonas Kim", role: "Honourary", grade: "Grade 11", initials: "JK", color: "#2c5eb0", photo: null },
  { name: "Kira Okonkwo", role: "Honourary", grade: "Grade 10", initials: "KO", color: "#1a7a5e", photo: null },
  { name: "Lena Braun", role: "Honourary", grade: "Grade 11", initials: "LB", color: "#6b3fa0", photo: null },
  { name: "Mihail Popescu", role: "Honourary", grade: "Grade 10", initials: "MP", color: "#2d6b8f", photo: null },
  { name: "Nour Khalil", role: "Honourary", grade: "Grade 11", initials: "NK", color: "#b5651d", photo: null },
];

function MemberCard({ member }) {
  return (
    <div className="member-card">
      {member.photo ? (
        <img src={member.photo} alt={member.name} className="member-avatar-photo" />
      ) : (
        <div className="member-avatar" style={{ backgroundColor: member.color }}>
          {member.initials}
        </div>
      )}
      <h3 className="member-name">{member.name}</h3>
      <p className="member-role">{member.role}</p>
      <p className="member-grade">{member.grade}</p>
    </div>
  );
}

export function OurTeamPage() {
  return (
    <div className="team-page">
      <div className="team-header">
        <h1 className="team-title">SAC Executive Team</h1>
        <p className="team-subtitle">
          Working closely with SAC staff advisors, the Executive Team oversees SAC and mentors members. The team is selected each May through an application or election process.
        </p>
      </div>

      <div className="member-grid">
        {execTeam.map((member) => (
          <MemberCard key={member.name} member={member} />
        ))}
      </div>

      <div className="team-header">
        <h1 className="team-title">Grade Representatives</h1>
        <p className="team-subtitle">
          Grade Representatives voice the opinions of their grade and help engage their peers. They are selected each September for the new school year.
        </p>
      </div>

      <div className="member-grid">
        {gradeRepresentatives.map((member) => (
          <MemberCard key={member.name} member={member} />
        ))}
      </div>

      <div className="team-header">
        <h1 className="team-title">Honouraries</h1>
        <p className="team-subtitle">
          Honorary Members make up most of SAC. They are student leaders who help plan, execute, and promote SAC events. Positions are selected at the start of the year and can be found here.
        </p>
      </div>

      <div className="member-grid">
        {generalMembers.map((member) => (
          <MemberCard key={member.name} member={member} />
        ))}
      </div>
    </div>
  );
}