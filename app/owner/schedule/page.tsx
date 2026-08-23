import {redirect} from "next/navigation";
import {OwnerGameManagement} from "@/components/OwnerManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import {getOwnerPortalData} from "@/lib/owner-data";

export default async function OwnerSchedulePage(){
  const data=await getOwnerPortalData();
  if(!data.authorized)redirect("/owner");
  return <OwnerPageShell title="Schedule" subtitle="Create, update, and finalize regular-season and playoff schedules." active="schedule"><OwnerGameManagement seasons={data.seasons}/></OwnerPageShell>;
}
