import {redirect} from "next/navigation";
import {OwnerPastPaymentsArchive,OwnerPaymentManagement} from "@/components/OwnerManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import {getOwnerPortalData} from "@/lib/owner-data";

export default async function OwnerPaymentsPage(){
  const data=await getOwnerPortalData();
  if(!data.authorized)redirect("/owner");
  const currentSeasonId=data.seasons.find(season=>!season.canceledAt)?.id??"";
  const currentGroups=data.paymentGroups.filter(group=>group.seasonId===currentSeasonId),pastGroups=data.paymentGroups.filter(group=>group.seasonId!==currentSeasonId);
  return <OwnerPageShell title="Payments" subtitle="Track current-season collections and review past seasons separately." active="payments"><OwnerPaymentManagement submissions={data.paymentSubmissions} groups={currentGroups}/><OwnerPastPaymentsArchive groups={pastGroups}/></OwnerPageShell>;
}
