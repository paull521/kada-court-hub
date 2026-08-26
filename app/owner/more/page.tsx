import Link from "next/link";
import {redirect} from "next/navigation";
import OwnerPageShell from "@/components/OwnerPageShell";
import RoleSwitcher from "@/components/RoleSwitcher";
import {getOwnerPortalData} from "@/lib/owner-data";
import {getAvailableRoles} from "@/lib/roles";
import {OwnerSupportRequest} from "@/components/PlatformOperations";

export default async function OwnerMorePage(){
  const[data,roles]=await Promise.all([getOwnerPortalData(),getAvailableRoles()]);
  if(!data.authorized)redirect("/owner");
  const pendingPayments=data.paymentSubmissions.filter(submission=>submission.status==="pending").length;
  return <OwnerPageShell title="More Tools" subtitle="Additional conference tasks and records." active="more" conferenceName={data.conferenceName}><RoleSwitcher roles={roles} active="owner"/><nav className="owner-more-list" aria-label="More owner tools"><Link href="/owner/payments"><span>▣</span><div><b>Payments</b><small>Review and confirm player payment notices</small></div>{pendingPayments>0&&<em>{pendingPayments}</em>}<strong>›</strong></Link><Link href="/owner/financials"><span>＄</span><div><b>Financial Summary</b><small>Track season income, expenses, and profit or loss</small></div><strong>›</strong></Link></nav><OwnerSupportRequest conferenceId={data.conferenceId}/></OwnerPageShell>;
}
