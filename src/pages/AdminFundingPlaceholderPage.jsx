export function AdminFundingPlaceholderPage({ embedded = false }) {
  return (
    <div className={embedded ? "exec-section" : "page"}>
      {embedded ? (
        <h2 className="exec-section__title">Club Funding Requests</h2>
      ) : (
        <header className="page-header">
          <h1>Club Funding Requests</h1>
        </header>
      )}
      <section className="panel">
        <p>Coming soon.</p>
        <p className="muted">
          Club funding submissions and review are not available yet.
        </p>
      </section>
    </div>
  );
}
