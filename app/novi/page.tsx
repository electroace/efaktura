import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAppUser } from "@/lib/app-auth";
import { companyFor, currentMonth, db, paidActive } from "@/lib/server";
import { Editor } from "../ui/editor";

export const dynamic = "force-dynamic";
export default async function NewPage() {
  const user = await requireAppUser("/novi");
  const company = await companyFor(user.userId);
  if (company?.status !== "approved") redirect("/");
  const usage = await db().prepare("SELECT COUNT(*) AS count FROM documents WHERE user_id=? AND month=? AND type='invoice'").bind(user.userId,currentMonth()).first<{count:number}>();
  return <div className="app-frame"><header className="app-header"><Link href="/" className="brand"><span className="brand-mark">e</span>faktura<span className="brand-dot">.</span>ba</Link><Link href="/">← Svi dokumenti</Link></header>
    <Editor isFree={!paidActive(company)} used={usage?.count ?? 0} vatRegistered={!!company.vat_registered} company={company}/></div>;
}
