import Image from "next/image";
import Link from "next/link";
import {ReactNode} from "react";
import PlayerContextSwitcher from "@/components/PlayerContextSwitcher";
import NotificationCenter from "@/components/NotificationCenter";
import type {PlayerContextOption,PlayerNotification} from "@/lib/kch-data";

const links = [["/home","home","⌂","Home"],["/my-team","team","♟","Teams"],["/schedule","schedule","▦","Schedule"],["/payments","payments","▣","Payments"],["/profile","profile","♙","Profile"]] as const;

export default function AppShell({children,active,contexts=[],activeRegistrationId="",notifications=[],requiresAttention=false,teamHasUnavailable=false,homeHref="/home"}:{children:ReactNode;active:string;contexts?:PlayerContextOption[];activeRegistrationId?:string;notifications?:PlayerNotification[];requiresAttention?:boolean;teamHasUnavailable?:boolean;homeHref?:string}) {
 return <div className="shell"><header className="topbar"><Image src="/kch-logo.png" alt="KadaCourtHub" width={340} height={130} className="logo" priority/><div className="topbar-actions"><PlayerContextSwitcher contexts={contexts} activeRegistrationId={activeRegistrationId}/><NotificationCenter notifications={notifications} requiresAttention={requiresAttention}/></div></header><main className="content">{children}</main><nav className="bottom" aria-label="Player navigation">{links.map(([href,key,icon,label])=><Link key={key} href={key==="home"?homeHref:href} className={`nav ${active===key?"active":""}`}><b aria-hidden="true">{icon}</b>{label}{key==="team"&&<i className={`nav-team-dot ${teamHasUnavailable?"no":"yes"}`}/>}</Link>)}</nav></div>;
}
