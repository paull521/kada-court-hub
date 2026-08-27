import {redirect} from "next/navigation";
import {OwnerSetupWizard} from "@/components/OwnerManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import {getOwnerPortalData} from "@/lib/owner-data";

export default async function OwnerSetupPage(){
  const data=await getOwnerPortalData();
  if(!data.authorized)redirect("/owner");
  return <OwnerPageShell title="Season Setup" subtitle={`${data.conferenceName} · Create seasons, divisions, and teams.`} active="home" conferenceName={data.conferenceName} conferenceId={data.conferenceId} conferences={data.conferences}><OwnerSetupWizard conferenceId={data.conferenceId} conferenceName={data.conferenceName} seasons={data.seasons} directory={data.directory}/></OwnerPageShell>;
}
