import { redirect } from "next/navigation";
import { requireAppUser } from "@/lib/app-auth";
import { companyFor, db, paidActive, type CatalogItem } from "@/lib/server";
import { AppHeader } from "../ui/app-header";
import { ItemDirectory } from "../ui/directories";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const user = await requireAppUser("/stavke");
  const company = await companyFor(user.userId);
  if (company?.status !== "approved") redirect("/");
  const rows = await db().prepare("SELECT * FROM catalog_items WHERE user_id=? ORDER BY name COLLATE NOCASE LIMIT 1000").bind(user.userId).all<CatalogItem>();
  return <div className="app-frame"><AppHeader user={user} hasCompany paid={paidActive(company)}/>
    <main className="app-main"><div className="directory-heading"><p className="eyebrow">VAŠ IMENIK</p><h1>Roba i usluge</h1><p>Dodajte stavke s cijenom, jedinicom mjere i stopom PDV-a; možete ih naknadno urediti.</p></div><ItemDirectory initial={rows.results} vatRegistered={!!company.vat_registered}/></main>
  </div>;
}
