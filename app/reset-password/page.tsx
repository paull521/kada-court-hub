import KchLogo from "@/components/KchLogo";
import { ResetPasswordForm } from "@/components/AuthForm";
import { loginColumn, loginColumnTight, loginLogo } from "@/components/ui/auth-classes";

export default function ResetPasswordPage() {
  return (
    <div className="shell login-shell">
      <header className={loginLogo}>
        <KchLogo />
      </header>
      <main className={`${loginColumn} ${loginColumnTight}`}>
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
