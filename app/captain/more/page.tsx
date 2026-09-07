import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import CaptainMoreLinks from "@/components/CaptainMoreLinks";
import RoleSwitcher from "@/components/RoleSwitcher";
import { getCaptainPortalData } from "@/lib/captain-data";
import { getAvailableRoles } from "@/lib/roles";

// Nothing in this page's body reads the portal - it is a role switcher and two
// links - so once the cheap role check has run, all of it paints immediately
// and only the shell's bell and badge wait on the portal read.
export default async function CaptainMorePage() {
  const roles = await getAvailableRoles();
  if (!roles.captain) redirect("/profile");
  const data = getCaptainPortalData();
  return (
    <CaptainShell
      data={data}
      active="more"
      title="More"
      subtitle="Captain settings and role tools."
    >
      <RoleSwitcher roles={roles} current="captain" />
      <CaptainMoreLinks />
    </CaptainShell>
  );
}
