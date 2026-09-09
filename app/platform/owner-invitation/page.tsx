import KchLogo from "@/components/KchLogo";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OwnerApplication } from "@/components/PlatformCreatorTools";
import { loginBox, loginColumn, loginLogo } from "@/components/ui/auth-classes";

export default async function OwnerInvitationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: application } = user
    ? await supabase
        .from("platform_owner_records")
        .select("id,proposed_conference_name")
        .eq("profile_id", user.id)
        .is("conference_id", null)
        .maybeSingle()
    : { data: null };
  const { data: acknowledgment } = application
    ? await supabase
        .from("platform_owner_demo_acknowledgments")
        .select("acknowledged_at")
        .eq("owner_record_id", application.id)
        .maybeSingle()
    : { data: null };
  const path = "/platform/owner-invitation";
  return (
    <div className="shell login-shell">
      <header className={loginLogo}>
        <KchLogo />
      </header>
      <main className={loginColumn}>
        <p className="eyebrow">KCH OWNER INVITATION</p>
        <h1>
          Become a<br />
          conference owner.
        </h1>
        <p className="subtitle">Start your KCH owner application.</p>
        {user ? (
          <OwnerApplication
            pendingApplication={
              application && acknowledgment
                ? {
                    conferenceName: application.proposed_conference_name,
                    acknowledgedAt: acknowledgment.acknowledged_at,
                  }
                : null
            }
          />
        ) : (
          <div className={`card ${loginBox}`}>
            <Link href={`/login?next=${encodeURIComponent(path)}`} className="btn primary">
              Log in to KCH
            </Link>
            <Link href={`/sign-up?next=${encodeURIComponent(path)}`} className="btn secondary">
              Create Profile
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
