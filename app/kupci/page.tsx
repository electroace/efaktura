import { redirect } from "next/navigation";
import { requireAppUser } from "@/lib/app-auth";
import { companyFor, db, paidActive, type Customer } from "@/lib/server";
import { AppHeader } from "../ui/app-header";
import { CustomerDirectory } from "../ui/directories";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const user = await requireAppUser("/kupci");
  const company = await companyFor(user.userId);
  if (company?.status !== "approved") redirect("/");
  const rows = await db().prepare("SELECT * FROM customers WHERE user_id=? ORDER BY name COLLATE NOCASE LIMIT 1000").bind(user.userId).all<Customer>();
  return <div className="app-frame"><AppHeader user={user} hasCompany paid={paidActive(company)}/>
    <main className="app-main"><div className="directory-heading"><p className="eyebrow">VAŠ IMENIK</p><h1>Kupci</h1><p>Sačuvajte podatke kupaca i njihovih kontakt osoba za naredne dokumente.</p></div><CustomerDirectory initial={rows.results}/></main>
  </div>;
}
