import Link from "next/link";
import { requireAppUser } from "@/lib/app-auth";
import { isAdmin } from "@/lib/server";
import { AdminTable } from "../ui/admin-table";
import { AdminRequests } from "../ui/admin-requests";
import { BillingSettingsForm } from "../ui/billing-settings-form";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await requireAppUser("/admin");
  if (!isAdmin(user.email)) return <main className="app-main"><h1>Nemate pristup administraciji.</h1><Link href="/">Nazad</Link></main>;
  return <div className="app-frame"><header className="app-header"><Link href="/" className="brand"><span className="brand-mark">e</span>faktura<span className="brand-dot">.</span>ba</Link><Link href="/">← Dokumenti</Link></header>
    <main className="app-main"><div className="dashboard-top"><div><p className="eyebrow">ADMINISTRACIJA</p><h1>Pretplate i firme</h1><p className="muted">Zahtjev za plaćeni paket stiže ovdje. Nakon uplate aktivirajte pristup na jedan mjesec. Cijenu možete prilagoditi za svaku firmu.</p></div></div><AdminRequests/><BillingSettingsForm/><AdminTable/></main></div>;
}
