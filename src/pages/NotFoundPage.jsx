import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="page narrow-page">
      <section className="panel">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The page you requested does not exist.</p>
        <div className="button-row">
          <Link to="/" className="button button--primary">
            Go home
          </Link>
          <Link to="/clubs" className="button button--secondary">
            Browse clubs
          </Link>
        </div>
      </section>
    </div>
  );
}
