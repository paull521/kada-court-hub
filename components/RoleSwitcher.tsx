import Link from "next/link";
import type {AvailableRoles} from "@/lib/roles";

export default function RoleSwitcher({roles,current,active}:{roles:AvailableRoles;current?:"player"|"captain"|"owner";active?:"player"|"captain"|"owner"}){
  current=current??active;
  const options=[roles.player&&["player","/home","Player"],roles.captain&&["captain","/captain","Captain"],roles.owner&&["owner","/owner","Owner"]].filter(Boolean) as string[][];
  if(options.length<2)return null;
  return <section className="card role-switcher"><small>VIEW AS</small><div>{options.map(([role,href,label])=><Link key={role} href={href} className={current===role?"active":""}>{label}</Link>)}</div></section>;
}
