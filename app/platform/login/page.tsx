import KchLogo from "@/components/KchLogo";
import Link from "next/link";
import { LoginForm } from "@/components/AuthForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function PlatformLoginPage() {
  return (
    <div className="shell login-shell platform-login-shell">
      <header className="login-logo">
        <KchLogo />
      </header>
      <main className="login">
        <p className="eyebrow">PRIVATE WORKSPACE</p>
        <h1>Platform Page</h1>
        <p className="subtitle">
          Conference management, Owner subscription and Support activities.
        </p>
        <LoginForm demoMode={!isSupabaseConfigured()} nextPath="/platform" allowSignUp={false} />
        <p className="platform-login-note">
          Creator accounts are granted separately from conference owner access. MFA can be required
          in Supabase for these accounts.
        </p>
        <Link className="forgot" href="/login">
          Player or owner sign in
        </Link>
      </main>
    </div>
  );
}
