"use client";

import Link from "next/link";
import {useActionState} from "react";
import {loginAction, signUpAction, type AuthActionState} from "@/app/auth/actions";

const initialState: AuthActionState = {};

export function LoginForm({demoMode,nextPath=""}:{demoMode:boolean;nextPath?:string}) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return <form action={action} className="card loginbox"><input type="hidden" name="nextPath" value={nextPath}/>
    {demoMode && <p className="setup-note">Demo mode is active. Log In opens the prototype until Supabase is connected.</p>}
    <label htmlFor="email">Email</label><div className="input-wrap"><span>✉</span><input id="email" name="email" type="email" autoComplete="email" placeholder="Enter your email"/></div>
    <label htmlFor="password">Password</label><div className="input-wrap"><span>♙</span><input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password"/><b>◉</b></div>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    <a href="#" className="forgot">Forgot Password?</a><button className="btn primary" disabled={pending}>{pending?"Logging In…":"Log In"}</button><Link className="btn secondary" href={nextPath?`/sign-up?next=${encodeURIComponent(nextPath)}`:"/sign-up"}>Create Profile</Link>
  </form>;
}

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
