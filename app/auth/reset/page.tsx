import { supabaseConfigured, supabasePublicConfig } from "@/lib/app-auth";
import { PasswordReset } from "../../ui/password-reset";

export const dynamic = "force-dynamic";
export default function ResetPage() {
  return <main className="auth-shell"><div className="panel auth-panel"><h1>Nova lozinka</h1>{supabaseConfigured() ? <PasswordReset config={supabasePublicConfig()}/> : <p>Prijava još nije povezana.</p>}</div></main>;
}
