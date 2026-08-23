import {redirect} from "next/navigation";
import {OwnerUniformManagement} from "@/components/OwnerManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import {getOwnerPortalData} from "@/lib/owner-data";

export default async function OwnerUniformsPage(){
  const data=await getOwnerPortalData();
  if(!data.authorized)redirect("/owner");
  return <OwnerPageShell title="Uniforms" subtitle="Dark and light reference photos, organized by season." active="more"><OwnerUniformManagement seasons={data.seasons}/></OwnerPageShell>;
}
