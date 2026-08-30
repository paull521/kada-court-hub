"use client";

import Link from "next/link";
import {useActionState,useEffect,useState,type FormEvent} from "react";
import {loginAction, logoutAction, signUpAction, type AuthActionState} from "@/app/auth/actions";
import {createClient as createBrowserClient} from "@/lib/supabase/client";
import {isSupabaseConfigured} from "@/lib/supabase/config";

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

export function PasswordResetRequestForm(){
  const[state,setState]=useState<AuthActionState>(initialState),[pending,setPending]=useState(false);
  const sendLink=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const email=String(new FormData(event.currentTarget).get("email")??"").trim().toLowerCase();if(!email){setState({error:"Enter the email for your KCH profile."});return;}if(!isSupabaseConfigured()){setState({error:"Password recovery is available once Supabase is connected."});return;}setPending(true);const supabase=createBrowserClient();const{error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`});setPending(false);setState(error?{error:"We could not send the reset email. Please try again."}:{message:"If that email has a KCH profile, a password-reset link is on its way."});};
  return <form onSubmit={sendLink} className="card loginbox"><label htmlFor="resetEmail">Email</label><div className="input-wrap"><span>✉</span><input id="resetEmail" name="email" type="email" autoComplete="email" placeholder="Enter your KCH email" required/></div>{state.error&&<p className="form-error" role="alert">{state.error}</p>}{state.message&&<p className="form-success" role="status">{state.message}</p>}<button className="btn primary" disabled={pending}>{pending?"Sending…":"Send Reset Link"}</button><Link className="btn secondary" href="/login">Back to Log In</Link></form>;
}

export function ResetPasswordForm(){
  const[state,setState]=useState<AuthActionState>(initialState),[pending,setPending]=useState(false),[ready,setReady]=useState(false);
  useEffect(()=>{if(!isSupabaseConfigured()){setState({error:"Password recovery is available once Supabase is connected."});return;}const url=new URL(window.location.href),code=url.searchParams.get("code"),hash=new URLSearchParams(url.hash.slice(1)),accessToken=hash.get("access_token"),refreshToken=hash.get("refresh_token"),supabase=createBrowserClient(),withTimeout=<T,>(promise:Promise<T>)=>Promise.race([promise,new Promise<never>((_,reject)=>window.setTimeout(()=>reject(new Error("timeout")),10000))]);void(async()=>{try{const current=await withTimeout(supabase.auth.getSession());const result=current.data.session?current:code?await withTimeout(supabase.auth.exchangeCodeForSession(code)):accessToken&&refreshToken?await withTimeout(supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken})):current;if(result.error||!result.data.session){setState({error:"This reset link is no longer valid. Please request a new one."});return;}window.history.replaceState(null,"",url.pathname);setReady(true);}catch{setState({error:"We could not verify this reset link. Please request a new one."});}})();},[]);
  const savePassword=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const password=String(new FormData(event.currentTarget).get("password")??"");if(password.length<8){setState({error:"Use a password with at least 8 characters."});return;}setPending(true);const supabase=createBrowserClient();const{error}=await supabase.auth.updateUser({password});setPending(false);if(error){setState({error:"This reset link is no longer valid. Please request a new one."});return;}setState({message:"Password updated. You can now log in."});};
  return <form onSubmit={savePassword} className="card loginbox"><label htmlFor="newPassword">New Password</label><div className="input-wrap"><span>♙</span><input id="newPassword" name="password" type="password" minLength={8} autoComplete="new-password" placeholder="At least 8 characters" required disabled={!ready}/></div>{state.error&&<p className="form-error" role="alert">{state.error}</p>}{state.message&&<p className="form-success" role="status">{state.message}</p>}<button className="btn primary" disabled={pending||!ready}>{pending?"Saving…":ready?"Save New Password":"Checking Reset Link…"}</button><button className="btn secondary" type="submit" formAction={logoutAction} formNoValidate>Back to Log In</button></form>;
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
