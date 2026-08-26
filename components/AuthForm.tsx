"use client";

import Link from "next/link";
import {useActionState} from "react";
import {loginAction, requestPasswordResetAction, signUpAction, updatePasswordAction, type AuthActionState} from "@/app/auth/actions";

const initialState: AuthActionState = {};

export function LoginForm({demoMode,nextPath="",allowSignUp=true}:{demoMode:boolean;nextPath?:string;allowSignUp?:boolean}) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return <form action={action} className="card loginbox"><input type="hidden" name="nextPath" value={nextPath}/>
    {demoMode && <p className="setup-note">Demo mode is active. Log In opens the prototype until Supabase is connected.</p>}
    <label htmlFor="email">Email</label><div className="input-wrap"><span>✉</span><input id="email" name="email" type="email" autoComplete="email" placeholder="Enter your email"/></div>
    <label htmlFor="password">Password</label><div className="input-wrap"><span>♙</span><input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password"/><b>◉</b></div>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    <Link href="/login?forgot=1" className="forgot">Forgot Password?</Link><button className="btn primary" disabled={pending}>{pending?"Logging In…":"Log In"}</button>{allowSignUp&&<Link className="btn secondary" href={nextPath?`/sign-up?next=${encodeURIComponent(nextPath)}`:"/sign-up"}>Create Profile</Link>}
  </form>;
}

export function PasswordResetRequestForm(){const[state,action,pending]=useActionState(requestPasswordResetAction,initialState);return <form action={action} className="card loginbox"><label htmlFor="resetEmail">Email</label><div className="input-wrap"><span>✉</span><input id="resetEmail" name="email" type="email" autoComplete="email" placeholder="Enter your KCH email" required/></div>{state.error&&<p className="form-error" role="alert">{state.error}</p>}{state.message&&<p className="form-success" role="status">{state.message}</p>}<button className="btn primary" disabled={pending}>{pending?"Sending…":"Send Reset Link"}</button><Link className="btn secondary" href="/login">Back to Log In</Link></form>}

export function ResetPasswordForm(){const[state,action,pending]=useActionState(updatePasswordAction,initialState);return <form action={action} className="card loginbox"><label htmlFor="newPassword">New Password</label><div className="input-wrap"><span>♙</span><input id="newPassword" name="password" type="password" minLength={8} autoComplete="new-password" placeholder="At least 8 characters" required/></div>{state.error&&<p className="form-error" role="alert">{state.error}</p>}{state.message&&<p className="form-success" role="status">{state.message}</p>}<button className="btn primary" disabled={pending}>{pending?"Saving…":"Save New Password"}</button><Link className="btn secondary" href="/login">Back to Log In</Link></form>}

export function SignUpForm({nextPath=""}:{nextPath?:string}) {
  const [state, action, pending] = useActionState(signUpAction, initialState);
  return <form action={action} className="card loginbox"><input type="hidden" name="nextPath" value={nextPath}/>
    <label htmlFor="displayName">Full Name</label><div className="input-wrap"><span>♙</span><input id="displayName" name="displayName" autoComplete="name" placeholder="Enter your full name" required/></div>
    <label htmlFor="signupEmail">Email</label><div className="input-wrap"><span>✉</span><input id="signupEmail" name="email" type="email" autoComplete="email" placeholder="Enter your email" required/></div>
    <label htmlFor="signupPassword">Password</label><div className="input-wrap"><span>♙</span><input id="signupPassword" name="password" type="password" minLength={8} autoComplete="new-password" placeholder="At least 8 characters" required/></div>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}{state.message && <p className="form-success" role="status">{state.message}</p>}
    <button className="btn primary" disabled={pending}>{pending?"Creating Profile…":"Create Profile"}</button><Link className="btn secondary" href={nextPath?`/login?next=${encodeURIComponent(nextPath)}`:"/login"}>Back to Log In</Link>
  </form>;
}
