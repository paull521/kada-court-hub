import Image from "next/image";
import Link from "next/link";
import {LoginForm} from "@/components/AuthForm";
import {isSupabaseConfigured} from "@/lib/supabase/config";

export default function PlatformLoginPage(){return <div className="shell login-shell platform-login-shell"><header className="login-logo"><Image src="/kch-logo.png" alt="KadaCourtHub" width={420} height={160} priority/></header><main className="login"><p className="eyebrow">PRIVATE WORKSPACE</p><h1>Platform Page</h1><p className="subtitle">Sign in to view KCH-wide totals, owner subscriptions, and invitations.</p><LoginForm demoMode={!isSupabaseConfigured()} nextPath="/platform" allowSignUp={false}/><p className="platform-login-note">Creator accounts are granted separately from conference owner access. MFA can be required in Supabase for these accounts.</p><Link className="forgot" href="/login">Player or owner sign in</Link></main></div>}
