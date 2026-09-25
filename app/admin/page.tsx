import Link from "next/link";
import { requireAppUser } from "@/lib/app-auth";
import { isAdmin } from "@/lib/server";
import { AdminTable } from "../ui/admin-table";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await requireAppUser("/admin");
  if (!isAdmin(user.email)) return <main className="app-main"><h1>Nemate pristup administraciji.</h1><Link href="/">Nazad</Link></main>;
  return <div className="app-frame"><header className="app-header"><Link href="/" className="brand"><span className="brand-mark">e</span>faktura<span className="brand-dot">.</span>ba</Link><Link href="/">← Dokumenti</Link></header>
    <main className="app-main"><div className="dashboard-top"><div><p className="eyebrow">ADMINISTRACIJA</p><h1>Firme i paketi</h1><p className="muted">Novi besplatni nalozi aktiviraju se automatski. Ovdje možete uključiti plaćeni paket i postaviti njegovu mjesečnu cijenu s PDV-om.</p></div></div><AdminTable/></main></div>;
}
