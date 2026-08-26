import {redirect} from "next/navigation";
import {OwnerPastPaymentsArchive,OwnerPaymentManagement} from "@/components/OwnerManagement";
import OwnerPageShell from "@/components/OwnerPageShell";
import {getOwnerPortalData} from "@/lib/owner-data";
import {getOwnerPaymentBilling} from "@/lib/owner-payment-ledger";
import {OwnerSubscriptionPayment} from "@/components/PlatformCreatorTools";

export default async function OwnerPaymentsPage(){const data=await getOwnerPortalData();if(!data.authorized)redirect("/owner");const billing=await getOwnerPaymentBilling(data.conferenceId);const today=new Date().toISOString().slice(0,10),currentSeasonIds=new Set(data.seasons.filter(season=>!season.canceledAt&&season.endsOn>=today).map(season=>season.id)),currentGroups=data.paymentGroups.filter(group=>currentSeasonIds.has(group.seasonId)),pastGroups=data.paymentGroups.filter(group=>!currentSeasonIds.has(group.seasonId));return <OwnerPageShell title="Payments" subtitle="Track current-season collections and review past seasons separately." active="payments" conferenceName={data.conferenceName}><section className="owner-operations owner-page-section monthly-subscription-section"><h2>Monthly Subscription</h2><p className="operations-intro">Monthly payment for KCH Platform Creator confirmation.</p><OwnerSubscriptionPayment conferenceId={data.conferenceId} billing={billing}/></section><OwnerPaymentManagement submissions={data.paymentSubmissions} groups={currentGroups}/><OwnerPastPaymentsArchive groups={pastGroups}/></OwnerPageShell>}
