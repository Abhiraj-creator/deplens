"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../../components/auth-provider";
export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);
  if (loading || !user)
    return (
      <main className="shell">
        <p className="muted">Loading your workspace…</p>
      </main>
    );
  return (
    <main className="shell">
      <div className="dashboard">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Good to see you, {user.name}.</h1>
          <p className="muted">
            Your deployment intelligence workspace is ready.
          </p>
        </div>
        <div className="card">
          <div
            className="avatar"
            aria-label={`${user.name}'s avatar`}
            role="img"
            style={{
              backgroundImage: `url(${user.avatarUrl})`,
              backgroundSize: "cover",
            }}
          />
          <p>
            <strong>{user.email}</strong>
          </p>
          <p className="muted">Role: {user.role}</p>
          <button
            type="button"
            className="secondary"
            onClick={() => logout().then(() => router.push("/login"))}
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
