import { getAppUser } from "@/lib/app-auth";
import { companyFor, currentMonth, db, paidActive, type DocumentRecord } from "@/lib/server";
import { Onboarding } from "./ui/onboarding";
import { DocumentList } from "./ui/document-list";
import { AppHeader } from "./ui/app-header";
import { PublicLanding } from "./ui/public-landing";
import { Plus, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getAppUser();
  if (!user) return <PublicLanding />;

  let company;
  let rows: Pick<DocumentRecord, "id"|"type"|"title"|"number"|"issue_date"|"client_name"|"created_at">[] = [];
  let used = 0;
  let unavailable = false;
  try {
    company = await companyFor(user.userId);
    if (company?.status === "approved") {
      const results = await Promise.all([
        db().prepare("SELECT id,type,title,number,issue_date,client_name,created_at FROM documents WHERE user_id=? ORDER BY created_at DESC LIMIT 200").bind(user.userId).all(),
        db().prepare("SELECT COUNT(*) AS count FROM documents WHERE user_id=? AND month=? AND type='invoice'").bind(user.userId, currentMonth()).first<{count:number}>(),
      ]);
      rows = results[0].results as typeof rows;
      used = results[1]?.count ?? 0;
    }
  } catch (error) {
    console.error("Dashboard unavailable", error);
    unavailable = true;
  }

  return <div className="app-frame">
    <AppHeader user={user} hasCompany={company?.status === "approved"} paid={!!company && paidActive(company)} />
    <main className="app-main">
      {unavailable ? <section className="panel center-state"><h1>Podaci trenutno nisu dostupni</h1><p>Pokušajte ponovo za nekoliko minuta.</p></section>
      : !company ? <Onboarding email={user.email} />
      : company.status !== "approved" ? <section className="panel center-state">
          <div className="state-icon"><ShieldCheck /></div>
          <h1>Nalog je privremeno nedostupan</h1><p>Obratite se administratoru na electroace@gmail.com.</p>
          <a href="/postavke" className="secondary-button">Pregledaj podatke firme</a>
        </section>
      : <>
        <section className="dashboard-top">
          <div><p className="eyebrow">RADNI PROSTOR</p><h1>Dokumenti</h1><p className="muted">{company.name} · {paidActive(company) ? `Plaćeni paket do ${new Date(company.paid_until!).toLocaleDateString("bs-BA")}` : "Besplatni paket"}</p></div>
          <a href="/novi" className="primary-button"><Plus size={18}/> Novi dokument</a>
        </section>
        <section className="overview-row">
          <div className="overview-card"><span>Fakture ovog mjeseca</span><strong>{used} {!paidActive(company) && <small>/ 3</small>}</strong><span>{paidActive(company) ? "kreiranih faktura" : "ponude i drugi dokumenti nisu ograničeni"}</span></div>
          <div className="overview-card"><span>Paket</span><strong>{paidActive(company) ? `${company.price_bam} KM` : "0 KM"}</strong><span>{paidActive(company) ? "mjesečno, s PDV-om" : "do 5 stavki po fakturi"}</span></div>
          <div className="overview-card accent-card"><span>Brz početak</span><strong>Faktura ili ponuda?</strong><span>Izaberite vrstu i dodajte stavke.</span><a href="/novi">Kreiraj dokument <span aria-hidden>→</span></a></div>
        </section>
        <DocumentList documents={rows}/>
        <p className="plan-footnote">{paidActive(company) ? "Za produženje pretplate" : "Za više od 3 fakture mjesečno ili više od 5 stavki po fakturi"}, <a href="/pretplata">zatražite plaćeni paket i preuzmite predračun</a>. Cijena za vašu firmu je {company.price_bam.toLocaleString("bs-BA",{minimumFractionDigits:2,maximumFractionDigits:2})} KM mjesečno s PDV-om.</p>
      </>}
    </main>
  </div>;
}
