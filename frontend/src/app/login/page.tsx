import Link from "next/link";
import { AuthForm } from "../../components/auth-form";
export default function LoginPage() {
  return (
    <main className="shell">
      <div className="stack">
        <p className="eyebrow">DepLens</p>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to continue to your workspace.</p>
        <AuthForm mode="login" />
        <p className="center muted">
          New here? <Link href="/register">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
