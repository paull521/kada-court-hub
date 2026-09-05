import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import RoleSwitcher from "@/components/RoleSwitcher";
import { getCaptainPortalData } from "@/lib/captain-data";
import { getAvailableRoles } from "@/lib/roles";

export default async function CaptainMorePage() {
  const [data, roles] = await Promise.all([getCaptainPortalData(), getAvailableRoles()]);
  if (!data.authorized) redirect("/profile");
  return (
    <CaptainShell
      data={data}
      active="more"
      title="More"
      subtitle="Captain settings and role tools."
    >
      <RoleSwitcher roles={roles} current="captain" />
      <nav className="owner-more-list">
        <Link href="/profile">
          <span>♙</span>
          <div>
            <b>Player Profile</b>
            <small>Personal details and uniform size</small>
          </div>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </Link>
        <Link href="/captain/availability">
          <span>✓</span>
          <div>
            <b>Availability</b>
            <small>Next-game team responses</small>
          </div>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </Link>
        <Link href="/legal">
          <span>▢</span>
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
