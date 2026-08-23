import {redirect} from "next/navigation";
import {OwnerPastPaymentsArchive,OwnerPaymentManagement} from "@/components/OwnerManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import {getOwnerPortalData} from "@/lib/owner-data";

export default async function OwnerPaymentsPage(){
  const data=await getOwnerPortalData();
  if(!data.authorized)redirect("/owner");
  const today=new Date().toISOString().slice(0,10);
  const currentSeasonIds=new Set(data.seasons.filter(season=>!season.canceledAt&&season.endsOn>=today).map(season=>season.id));
  const currentGroups=data.paymentGroups.filter(group=>currentSeasonIds.has(group.seasonId)),pastGroups=data.paymentGroups.filter(group=>!currentSeasonIds.has(group.seasonId));
  return <OwnerPageShell title="Payments" subtitle="Track current-season collections and review past seasons separately." active="payments"><OwnerPaymentManagement submissions={data.paymentSubmissions} groups={currentGroups}/><OwnerPastPaymentsArchive groups={pastGroups}/></OwnerPageShell>;
}
