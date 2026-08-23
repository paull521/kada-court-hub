import Image from "next/image";
import {LoginForm} from "@/components/AuthForm";
import {isSupabaseConfigured} from "@/lib/supabase/config";

export default async function Login({searchParams}:{searchParams:Promise<{next?:string}>}){const nextPath=(await searchParams).next??"";return <div className="shell login-shell"><header className="login-logo"><Image src="/kch-logo.png" alt="KadaCourtHub" width={420} height={160} priority/></header><main className="login"><h1>Welcome to<br/>KadaCourtHub</h1><p className="subtitle">One place for your team, schedule,<br/>payments, and profile.</p><LoginForm demoMode={!isSupabaseConfigured()} nextPath={nextPath}/><p className="new-player">♙＋ <span>New player? <b>Create your KCH profile</b><br/>to join your conference.</span></p><p className="login-tagline">★<br/><b>One profile. <span>Multiple conferences.</span></b></p></main></div>}
