import { BookOpen, Check, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
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
      <nav className="owner-more-list">
        <Link href="/profile?view=captain">
          <span>
            <User className="ui-icon" />
          </span>
          <div>
            <b>Player Profile</b>
            <small>Personal details and uniform size</small>
          </div>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </Link>
        <Link href="/captain/availability">
          <span>
            <Check className="ui-icon" />
          </span>
          <div>
            <b>Availability</b>
            <small>Next-game team responses</small>
          </div>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </Link>
        <Link href="/legal">
          <span>
            <BookOpen className="ui-icon" />
          </span>
          <div>
            <b>Privacy &amp; Terms</b>
          </div>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </Link>
      </nav>
    </CaptainShell>
  );
}
