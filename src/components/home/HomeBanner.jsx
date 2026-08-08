import { AnimatedLayeredWaves } from "./AnimatedLayeredWaves";

/**
 * Full-width home welcome banner with animated Haikei layered-wave background.
 */
export function HomeBanner() {
  return (
    <section className="home-banner" aria-label="Welcome">
      <AnimatedLayeredWaves />
      <div className="home-banner__inner">
        <div className="home-banner__copy">
          <p className="home-banner__eyebrow">John Fraser SAC</p>
          <h1 className="home-banner__title">
            <span className="home-banner__line">Welcome back,</span>
            <span className="home-banner__accent">Jaguar</span>
          </h1>
        </div>
      </div>
    </section>
  );
}
