import Link from "next/link";
import type {AvailableRoles} from "@/lib/roles";

export default function RoleSwitcher({roles,current,active,profile}:{roles:AvailableRoles;current?:"player"|"captain"|"owner";active?:"player"|"captain"|"owner";profile?:boolean}){
  current=current??active;
  const options=(profile?[roles.player&&["player","/profile","Player"],roles.captain&&["captain","/profile?view=captain","Captain"],roles.owner&&["owner","/profile?view=owner","Owner"]]:[roles.player&&["player","/home","Player"],roles.captain&&["captain","/captain","Captain"],roles.owner&&["owner","/owner","Owner"]]).filter(Boolean) as string[][];
  if(options.length<2)return null;
  return <section className="card role-switcher"><small>VIEW AS</small><div>{options.map(([role,href,label])=><Link key={role} href={href} prefetch className={current===role?"active":""}>{label}</Link>)}</div></section>;
}
