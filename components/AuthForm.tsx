"use client";

import { Mail, User } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState, type FormEvent } from "react";
import { loginAction, logoutAction, signUpAction, type AuthActionState } from "@/app/auth/actions";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const initialState: AuthActionState = {};

export function LoginForm({
  demoMode,
  nextPath = "",
  allowSignUp = true,
}: {
  demoMode: boolean;
  nextPath?: string;
  allowSignUp?: boolean;
}) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form action={action} className="card loginbox">
      <input type="hidden" name="nextPath" value={nextPath} />
      {demoMode && (
        <p className="setup-note">
          Demo mode is active. Log In opens the prototype until Supabase is connected.
        </p>
      )}
      <label htmlFor="email">Email</label>
      <div className="input-wrap">
        <span>
          <Mail className="ui-icon" />
        </span>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
        />
      </div>
      <label htmlFor="password">Password</label>
      <div className="input-wrap">
        <span>
          <User className="ui-icon" />
        </span>
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Enter your password"
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword((value) => !value)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.7 10.7 0 0 1 12 5c5.2 0 8.7 4.6 9.7 6.2a1.5 1.5 0 0 1 0 1.6 15.6 15.6 0 0 1-3.1 3.6M6.2 6.2a15.5 15.5 0 0 0-3.9 5 1.5 1.5 0 0 0 0 1.6C3.3 14.4 6.8 19 12 19c1 0 2-.2 2.9-.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.3 12a1.5 1.5 0 0 1 0-1.6C3.3 8.8 6.8 5 12 5s8.7 3.8 9.7 5.4a1.5 1.5 0 0 1 0 1.6C20.7 13.6 17.2 17 12 17S3.3 13.6 2.3 12Z" />
              <circle cx="12" cy="11.2" r="3" />
            </svg>
          )}
        </button>
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <Link href="/login?forgot=1" className="forgot">
        Forgot Password?
      </Link>
      <button className="btn primary" disabled={pending}>
        {pending ? "Logging In…" : "Log In"}
      </button>
      {allowSignUp && (
        <Link
          className="btn secondary"
          href={nextPath ? `/sign-up?next=${encodeURIComponent(nextPath)}` : "/sign-up"}
        >
          Create Profile
        </Link>
      )}
    </form>
  );
}

export function PasswordResetRequestForm() {
  const [state, setState] = useState<AuthActionState>(initialState),
    [pending, setPending] = useState(false);
  const sendLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "")
      .trim()
      .toLowerCase();
    if (!email) {
      setState({ error: "Enter the email for your KCH profile." });
      return;
    }
    if (!isSupabaseConfigured()) {
      setState({ error: "Password recovery is available once Supabase is connected." });
      return;
    }
    setPending(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    setState(
      error
        ? { error: "We could not send the reset email. Please try again." }
        : { message: "If that email has a KCH profile, a password-reset link is on its way." },
    );
  };
  return (
    <form onSubmit={sendLink} className="card loginbox">
      <label htmlFor="resetEmail">Email</label>
      <div className="input-wrap">
        <span>
          <Mail className="ui-icon" />
        </span>
        <input
          id="resetEmail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your KCH email"
          required
        />
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="form-success" role="status">
          {state.message}
        </p>
      )}
      <button className="btn primary" disabled={pending}>
        {pending ? "Sending…" : "Send Reset Link"}
      </button>
      <Link className="btn secondary" href="/login">
        Back to Log In
      </Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, setState] = useState<AuthActionState>(initialState),
    [pending, setPending] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState({ error: "Password recovery is available once Supabase is connected." });
      return;
    }
    const url = new URL(window.location.href),
      code = url.searchParams.get("code"),
      hash = new URLSearchParams(url.hash.slice(1)),
      accessToken = hash.get("access_token"),
      refreshToken = hash.get("refresh_token"),
      supabase = createBrowserClient(),
      withTimeout = <T,>(promise: Promise<T>) =>
        Promise.race([
          promise,
          new Promise<never>((_, reject) =>
            window.setTimeout(() => reject(new Error("timeout")), 10000),
          ),
        ]);
    void (async () => {
      try {
        const current = await withTimeout(supabase.auth.getSession());
        const result = current.data.session
          ? current
          : code
            ? await withTimeout(supabase.auth.exchangeCodeForSession(code))
            : accessToken && refreshToken
              ? await withTimeout(
                  supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                  }),
                )
              : current;
        if (result.error || !result.data.session) {
          setState({ error: "This reset link is no longer valid. Please request a new one." });
          return;
        }
        window.history.replaceState(null, "", url.pathname);
        setReady(true);
      } catch {
        setState({ error: "We could not verify this reset link. Please request a new one." });
      }
    })();
  }, []);
  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    if (password.length < 8) {
      setState({ error: "Use a password with at least 8 characters." });
      return;
    }
    setPending(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      setState({ error: "This reset link is no longer valid. Please request a new one." });
      return;
    }
    setState({ message: "Password updated. You can now log in." });
  };
  return (
    <form onSubmit={savePassword} className="card loginbox">
      <label htmlFor="newPassword">New Password</label>
      <div className="input-wrap">
        <span>
          <User className="ui-icon" />
        </span>
        <input
          id="newPassword"
          name="password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          disabled={!ready}
        />
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="form-success" role="status">
          {state.message}
        </p>
      )}
      <button className="btn primary" disabled={pending || !ready}>
        {pending ? "Saving…" : ready ? "Save New Password" : "Checking Reset Link…"}
      </button>
      <button className="btn secondary" type="submit" formAction={logoutAction} formNoValidate>
        Back to Log In
      </button>
    </form>
  );
}

export function SignUpForm({ nextPath = "" }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(signUpAction, initialState);
  return (
    <form action={action} className="card loginbox">
      <input type="hidden" name="nextPath" value={nextPath} />
      <label htmlFor="displayName">Full Name</label>
      <div className="input-wrap">
        <span>
          <User className="ui-icon" />
        </span>
        <input
          id="displayName"
          name="displayName"
          autoComplete="name"
          placeholder="Enter your full name"
          required
        />
      </div>
      <label htmlFor="signupEmail">Email</label>
      <div className="input-wrap">
        <span>
          <Mail className="ui-icon" />
        </span>
        <input
          id="signupEmail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          required
        />
      </div>
      <label htmlFor="signupPassword">Password</label>
      <div className="input-wrap">
        <span>
          <User className="ui-icon" />
        </span>
        <input
          id="signupPassword"
          name="password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
        />
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="form-success" role="status">
          {state.message}
        </p>
      )}
      <button className="btn primary" disabled={pending}>
        {pending ? "Creating Profile…" : "Create Profile"}
      </button>
      <Link
        className="btn secondary"
        href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
      >
        Back to Log In
      </Link>
    </form>
  );
}
