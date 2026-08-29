import Image from "next/image";
import {redirect} from "next/navigation";
import {SignUpForm} from "@/components/AuthForm";

export default async function SignUp({searchParams}:{searchParams:Promise<{next?:string}>}){const nextPath=(await searchParams).next??"";if(!/^\/(?:invite|platform\/invite)\/[0-9a-f-]{36}$/i.test(nextPath))redirect("/login");return <div className="shell login-shell"><header className="login-logo"><Image src="/kch-logo.png" alt="KadaCourtHub" width={420} height={160} priority/></header><main className="login signup"><h1>Create your<br/>KCH Profile</h1><p className="subtitle">One profile can join multiple conferences.</p><SignUpForm nextPath={nextPath}/></main></div>}
