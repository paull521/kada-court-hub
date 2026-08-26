import {redirect} from "next/navigation";
import OwnerPageShell from "@/components/OwnerPageShell";
import OwnerScoresheets from "@/components/OwnerScoresheets";
import {getOwnerPortalData} from "@/lib/owner-data";

export default async function OwnerScoresPage(){
  const data=await getOwnerPortalData();
  if(!data.authorized)redirect("/owner");
  return <OwnerPageShell title="Scoresheets" subtitle="Post final scores without the schedule-management clutter." active="home" conferenceName={data.conferenceName}><OwnerScoresheets seasons={data.seasons}/></OwnerPageShell>;
}
