import Image from "next/image";
import {ReactNode} from "react";
import PlayerContextSwitcher from "@/components/PlayerContextSwitcher";
import NotificationCenter from "@/components/NotificationCenter";
import FastBottomNav from "@/components/FastBottomNav";
import type {PlayerContextOption,PlayerNotification} from "@/lib/kch-data";

const links = [["/home","home","⌂","Home"],["/my-team","team","♟","Teams"],["/schedule","schedule","▦","Schedule"],["/payments","payments","▣","Payments"],["/profile","profile","♙","Profile"]] as const;

export default function AppShell({children,active,contexts=[],activeRegistrationId="",notifications=[],profileNeedsAttention=false,paymentNeedsAttention=false,teamHasUnavailable=false,homeHref="/home"}:{children:ReactNode;active:string;contexts?:PlayerContextOption[];activeRegistrationId?:string;notifications?:PlayerNotification[];profileNeedsAttention?:boolean;paymentNeedsAttention?:boolean;teamHasUnavailable?:boolean;homeHref?:string}) {
 const items=links.map(([href,key,icon,label])=>({href:key==="home"?homeHref:href,key,icon,label,dot:key==="team"?(teamHasUnavailable?"team-no":"team-yes"):(key==="profile"&&profileNeedsAttention)||(key==="payments"&&paymentNeedsAttention)?"alert":undefined}));
 return <div className="shell"><header className="topbar"><Image src="/kch-logo.png" alt="KadaCourtHub" width={340} height={130} className="logo" priority/><div className="topbar-actions"><PlayerContextSwitcher contexts={contexts} activeRegistrationId={activeRegistrationId}/><NotificationCenter notifications={notifications}/></div></header><main className="content">{children}</main><FastBottomNav items={items} active={active} label="Player navigation"/></div>;
}
