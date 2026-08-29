import Image from "next/image";
import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {OwnerApplication} from "@/components/PlatformCreatorTools";

export default async function OwnerInvitationPage(){const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();const path="/platform/owner-invitation";return <div className="shell login-shell"><header className="login-logo"><Image src="/kch-logo.png" alt="KadaCourtHub" width={420} height={160} priority/></header><main className="login"><p className="eyebrow">KCH OWNER INVITATION</p><h1>Become a<br/>conference owner.</h1><p className="subtitle">Owner access begins from an individual Platform Creator invitation.</p>{user?<OwnerApplication/>:<div className="card loginbox"><Link href={`/login?next=${encodeURIComponent(path)}`} className="btn primary">Log in to KCH</Link></div>}</main></div>}
