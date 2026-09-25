import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAppUser } from "@/lib/app-auth";
import { companyFor, db, paidActive } from "@/lib/server";
import { billingReady, billingSettings, type PlanRequest } from "@/lib/billing";
import { PlanAccess } from "../ui/plan-access";

export const dynamic = "force-dynamic";
export default async function SubscriptionPage() {
  const user = await requireAppUser("/pretplata");
  const company = await companyFor(user.userId);
  if (!company || company.status !== "approved") redirect("/");
  const [settings, rows] = await Promise.all([
    billingSettings(),
    db().prepare("SELECT * FROM plan_requests WHERE user_id=? ORDER BY created_at DESC LIMIT 20").bind(user.userId).all<PlanRequest>(),
  ]);
  return <div className="app-frame"><header className="app-header"><Link href="/" className="brand"><span className="brand-mark">e</span>faktura<span className="brand-dot">.</span>ba</Link><Link href="/">← Dokumenti</Link></header>
    <main className="app-main"><div className="dashboard-top"><div><p className="eyebrow">PRETPLATA</p><h1>Plaćeni paket</h1><p className="muted">Više faktura i stavki, za jedan mjesec od aktivacije.</p></div></div>
      <PlanAccess initial={rows.results} ready={billingReady(settings)} price={company.price_bam} activeUntil={paidActive(company) ? company.paid_until : null}/>
    </main></div>;
}
