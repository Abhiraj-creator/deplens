import Link from "next/link";

export default function Home() {
  return (
    <main className="shell">
      <div className="hero">
        <p className="eyebrow">DepLens</p>
        <h1>See what your deployments are trying to tell you.</h1>
        <p className="muted">
          A focused workspace for understanding release health, risk, and
          momentum.
        </p>
        <div className="actions">
          <Link className="button" href="/register">
            Get started
          </Link>
          <Link className="button secondary" href="/login">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
