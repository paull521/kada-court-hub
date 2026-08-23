import Link from "next/link";

const tabs=[
  {href:"/schedule",label:"Schedule"},
  {href:"/standings",label:"Standings"},
  {href:"/results",label:"Results"},
] as const;

export default function SeasonTabs({active}:{active:"schedule"|"standings"|"results"}){
  return <nav className="season-tabs" aria-label="Season views">{tabs.map(tab=><Link key={tab.href} href={tab.href} className={active===tab.label.toLowerCase()?"active":""}>{tab.label}</Link>)}</nav>;
}
