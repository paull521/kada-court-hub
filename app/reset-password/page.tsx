import Image from "next/image";
import { ResetPasswordForm } from "@/components/AuthForm";

export default function ResetPasswordPage() {
  return (
    <div className="shell login-shell">
      <header className="login-logo">
        <Image src="/kch-logo.png" alt="KadaCourtHub" width={420} height={160} priority />
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
