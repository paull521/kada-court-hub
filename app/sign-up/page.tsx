import KchLogo from "@/components/KchLogo";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/AuthForm";
import { loginColumn, loginColumnTight, loginLogo } from "@/components/ui/auth-classes";

export default async function SignUp({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const nextPath = (await searchParams).next ?? "";
  if (
    nextPath !== "/platform/owner-invitation" &&
    !/^\/(?:invite|platform\/invite)\/[0-9a-f-]{36}$/i.test(nextPath)
  )
    redirect("/login");
  return (
    <div className="shell login-shell">
      <header className={loginLogo}>
        <KchLogo />
      </header>
      <main className={`${loginColumn} ${loginColumnTight}`}>
        <h1>
          Create your
          <br />
          KCH Profile
        </h1>
        <p className="subtitle">One profile can join multiple conferences.</p>
        <SignUpForm nextPath={nextPath} />
      </main>
    </div>
  );
}
