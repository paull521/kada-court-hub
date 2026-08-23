import Link from "next/link";

const links=[
  ["/owner","home","⌂","Home"],
  ["/owner/roster?view=teams","teams","♟","Teams"],
  ["/owner/schedule","schedule","▦","Schedule"],
  ["/owner/payments","payments","▣","Payments"],
  ["/profile?view=owner","profile","♙","Profile"],
] as const;

export type OwnerNavKey=(typeof links)[number][1]|"season"|"scores"|"more";

export default function OwnerBottomNav({active}:{active:OwnerNavKey}){
  const selected=active==="season"||active==="scores"?"home":active==="more"?"profile":active;
  return <nav className="bottom owner-bottom" aria-label="Owner navigation">{links.map(([href,key,icon,label])=><Link key={key} href={href} className={`nav ${selected===key?"active":""}`}><b aria-hidden="true">{icon}</b>{label}</Link>)}</nav>;
}
