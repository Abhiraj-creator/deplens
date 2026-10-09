import Link from "next/link";
import { AuthForm } from "../../components/auth-form";
export default function RegisterPage() {
  return (
    <main className="shell">
      <div className="stack">
        <p className="eyebrow">DepLens</p>
        <h1>Create your account</h1>
        <p className="muted">Start understanding your deployments.</p>
        <AuthForm mode="register" />
        <p className="center muted">
          Already registered? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
