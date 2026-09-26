import { companyFor, db, paidActive, requireWorkspaceUser } from "@/lib/server";
import { billingReady, billingSettings, type PlanRequest } from "@/lib/billing";
import { PlanAccess } from "../ui/plan-access";
import { AppHeader } from "../ui/app-header";

export const dynamic = "force-dynamic";
export default async function SubscriptionPage() {
  const user = await requireWorkspaceUser("/pretplata");
  const company = await companyFor(user.userId);
  if (!company || company.status !== "approved") return <div className="app-frame"><AppHeader user={user}/><main className="app-main"><section className="panel center-state"><h1>Prvo unesite svoju firmu</h1><p>Nakon unosa podataka firme možete izabrati neograničeni paket i preuzeti predračun.</p><a href="/" className="primary-button">Unesi podatke firme →</a></section></main></div>;
  const [settings, rows] = await Promise.all([
    billingSettings(),
    db().prepare("SELECT * FROM plan_requests WHERE user_id=? ORDER BY created_at DESC LIMIT 20").bind(user.userId).all<PlanRequest>(),
  ]);
  return <div className="app-frame"><AppHeader user={user} hasCompany paid={paidActive(company)}/>
    <main className="app-main"><div className="dashboard-top"><div><p className="eyebrow">PRETPLATA</p><h1>Plaćeni paket</h1><p className="muted">Više faktura i stavki, za jedan mjesec od aktivacije.</p></div></div>
      <PlanAccess initial={rows.results} ready={billingReady(settings)} price={company.price_bam} activeUntil={paidActive(company) ? company.paid_until : null}/>
    </main></div>;
}
