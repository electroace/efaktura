import { companyFor, currentMonth, db, paidActive, workspaceUser, type DocumentRecord } from "@/lib/server";
import { Onboarding } from "./ui/onboarding";
import { DocumentList } from "./ui/document-list";
import { AppHeader } from "./ui/app-header";
import { PublicLanding } from "./ui/public-landing";
import { Plus, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home({searchParams}:{searchParams:Promise<{q?:string;type?:string;page?:string}>}) {
  const params=await searchParams;
  const query=typeof params.q==="string"?params.q.trim().slice(0,100):"";
  const type=["invoice","offer","custom"].includes(params.type??"")?params.type!:"";
  const page=Math.max(1,Math.min(1000,Number.parseInt(params.page??"1",10)||1));
  const user = await workspaceUser();
  if (!user) return <PublicLanding />;

  let company;
  let rows: Pick<DocumentRecord, "id"|"type"|"title"|"number"|"issue_date"|"client_name"|"created_at">[] = [];
  let used = 0;
  let total = 0;
  let unavailable = false;
  try {
    company = await companyFor(user.userId);
    if (company?.status === "approved") {
      const where = `user_id=?${type?" AND type=?":""}${query?" AND (instr(lower(number),lower(?))>0 OR instr(lower(title),lower(?))>0 OR instr(lower(client_name),lower(?))>0 OR instr(lower(fiscal_number),lower(?))>0)":""}`;
      const values:(string|number)[]=[user.userId];
      if(type) values.push(type);
      if(query) values.push(query,query,query,query);
      const results = await Promise.all([
        db().prepare(`SELECT id,type,title,number,issue_date,client_name,created_at FROM documents WHERE ${where} ORDER BY created_at DESC LIMIT 50 OFFSET ?`).bind(...values,(page-1)*50).all(),
        db().prepare("SELECT COUNT(*) AS count FROM documents WHERE user_id=? AND month=?").bind(user.userId, currentMonth()).first<{count:number}>(),
        db().prepare(`SELECT COUNT(*) AS count FROM documents WHERE ${where}`).bind(...values).first<{count:number}>(),
      ]);
      rows = results[0].results as typeof rows;
      used = results[1]?.count ?? 0;
      total = results[2]?.count ?? 0;
    }
  } catch (error) {
    console.error("Dashboard unavailable", error);
    unavailable = true;
  }

  return <div className="app-frame">
    <AppHeader user={user} hasCompany={company?.status === "approved"} paid={!!company && paidActive(company)} />
    <main className="app-main">
      {unavailable ? <section className="panel center-state"><h1>Podaci trenutno nisu dostupni</h1><p>Pokušajte ponovo za nekoliko minuta.</p></section>
      : !company ? <Onboarding email={user.email} initial={user.registration?.fullName || user.registration?.companyName ? {
          name:user.registration.companyName,address:user.registration.address,city:user.registration.city,
          postalCode:"",jib:user.registration.jib,vatId:"",vatRegistered:false,iban:"",bank:"",
          phone:user.registration.phone,contactEmail:user.email,contactPerson:user.registration.fullName,
          defaultNote:"",responsiblePerson:"",electronicNotice:true,showSignatureLine:false,
          invoiceTitle:"Faktura",offerTitle:"Ponuda",showDiscount:false,
        } : undefined}/>
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
          <div className="overview-card"><span>Dokumenti ovog mjeseca</span><strong>{used} {!paidActive(company) && <small>/ 3</small>}</strong><span>{paidActive(company) ? "kreiranih dokumenata" : "sve vrste dokumenata"}</span></div>
          <div className="overview-card"><span>Paket</span><strong>{paidActive(company) ? `${company.price_bam} KM` : "0 KM"}</strong><span>{paidActive(company) ? "mjesečno, s PDV-om" : "do 5 stavki po dokumentu"}</span></div>
          <div className="overview-card accent-card"><span>Brz početak</span><strong>Faktura ili ponuda?</strong><span>Izaberite vrstu i dodajte stavke.</span><a href="/novi">Kreiraj dokument <span aria-hidden>→</span></a></div>
        </section>
        <DocumentList documents={rows} query={query} type={type} page={page} total={total}/>
        <p className="plan-footnote">{paidActive(company) ? "Za produženje pretplate" : "Za više od 3 dokumenta mjesečno ili više od 5 stavki po dokumentu"}, <a href="/pretplata">kupite neograničenu verziju i preuzmite predračun</a>. Cijena za vašu firmu je {company.price_bam.toLocaleString("bs-BA",{minimumFractionDigits:2,maximumFractionDigits:2})} KM mjesečno s PDV-om.</p>
      </>}
    </main>
  </div>;
}
