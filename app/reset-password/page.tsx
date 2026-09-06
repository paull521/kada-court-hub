import KchLogo from "@/components/KchLogo";
import { ResetPasswordForm } from "@/components/AuthForm";

export default function ResetPasswordPage() {
  return (
    <div className="shell login-shell">
      <header className="login-logo">
        <KchLogo />
      </header>
      <main className="login signup">
        <h1>
          Set a new
          <br />
          password
        </h1>
        <p className="subtitle">Choose a new password for your KCH profile.</p>
        <ResetPasswordForm />
      </main>
    </div>
  );
}
