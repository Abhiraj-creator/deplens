import { APP_NAME } from "../config/app";
import { ThemeToggle } from "../components/theme-toggle";

export default function Home() {
  return (
    <main className="shell">
      <div className="hero">
        <p className="eyebrow">{APP_NAME}</p>
        <h1>A dependable foundation for dependency intelligence.</h1>
        <p className="muted">
          Phase 0 provides the web shell, typed API, local services, and project standards.
        </p>
        <ThemeToggle />
      </div>
    </main>
  );
}
