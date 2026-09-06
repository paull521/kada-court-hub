import { Star } from "lucide-react";
import KchLogo from "@/components/KchLogo";
import { LoginForm, PasswordResetRequestForm } from "@/components/AuthForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; forgot?: string; confirmationError?: string }>;
}) {
  const params = await searchParams,
    nextPath = params.next ?? "",
    forgot = params.forgot === "1",
    confirmationError = params.confirmationError === "1";
  return (
    <div className="shell login-shell">
      <header className="login-logo">
        <KchLogo />
      </header>
      <main className="login">
        <h1>
          {forgot ? (
            <>
              Reset your
              <br />
              password
            </>
          ) : (
            <>
              Welcome to
              <br />
              KadaCourtHub
            </>
          )}
        </h1>
        <p className="subtitle">
          {forgot ? (
            "We’ll email a secure link to reset it."
          ) : (
            <>
              One place for your team, schedule,
              <br />
              payments, and profile.
            </>
          )}
        </p>
        {forgot ? (
          <PasswordResetRequestForm />
        ) : (
          <>
            {confirmationError && (
              <p className="form-error" role="alert">
                This sign-in confirmation link could not be verified. Open the conference invitation
                again to create your profile.
              </p>
            )}
            <LoginForm demoMode={!isSupabaseConfigured()} nextPath={nextPath} allowSignUp={false} />
            <p className="login-tagline">
              <Star className="ui-icon" />
              <br />
              <b>
                One profile. <span>Multiple conferences.</span>
              </b>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
