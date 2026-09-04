import Image from "next/image";
import Link from "next/link";
import { AcceptOwnerInvitation, OwnerContractSignature } from "@/components/PlatformCreatorTools";
import { createClient } from "@/lib/supabase/server";

export default async function PlatformOwnerInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = /^[0-9a-f-]{36}$/i.test(token),
    path = `/platform/invite/${token}`,
    supabase = await createClient(),
    {
      data: { user },
    } = await supabase.auth.getUser();
  return (
    <div className="shell login-shell">
      <header className="login-logo">
        <Image src="/kch-logo.png" alt="KadaCourtHub" width={420} height={160} priority />
      </header>
      <main className="login">
        <p className="eyebrow">OWNER INVITATION</p>
        <h1>
          Run your
          <br />
          conference.
        </h1>
        <p className="subtitle">Sign the agreement to begin your owner application.</p>
        {!valid ? (
          <p className="form-error">This invitation link is not valid.</p>
        ) : !user ? (
          <div className="card loginbox">
            <Link href={`/login?next=${encodeURIComponent(path)}`} className="btn primary">
              Log In
            </Link>
            <Link href={`/sign-up?next=${encodeURIComponent(path)}`} className="btn secondary">
              Create Profile
            </Link>
          </div>
        ) : (
          <>
            <AcceptOwnerInvitation token={token} />
            <OwnerContractSignature token={token} />
          </>
        )}
      </main>
    </div>
  );
}
