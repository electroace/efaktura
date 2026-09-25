import Link from "next/link";
import { env } from "cloudflare:workers";
import { supabaseConfigured, supabasePublicConfig, safeReturnPath } from "@/lib/app-auth";
import { AuthForm } from "../ui/auth-form";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeReturnPath((await searchParams).next ?? null);
  if (!supabaseConfigured()) return <main className="auth-shell"><div className="panel auth-panel"><h1>Prijava</h1><p>Prijava za javnu aplikaciju još nije povezana. Pokušajte ponovo nakon podešavanja.</p></div></main>;
  return <main className="auth-shell"><div className="panel auth-panel">
    <Link href="/" className="brand"><span className="brand-mark">e</span>faktura<span className="brand-dot">.</span>ba</Link>
    <p className="eyebrow">VAŠ NALOG</p><h1>Prijava ili registracija</h1>
    <p>Besplatni paket se aktivira čim unesete podatke firme.</p>
    <AuthForm config={supabasePublicConfig()} next={next} googleEnabled={env.GOOGLE_SIGN_IN_ENABLED === "true"} appleEnabled={env.APPLE_SIGN_IN_ENABLED === "true"}/>
  </div></main>;
}
