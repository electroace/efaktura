import { redirect } from "next/navigation";
import { requireAppUser } from "@/lib/app-auth";
import { companyFor, currentMonth, db, paidActive } from "@/lib/server";
import { Editor } from "../ui/editor";
import { AppHeader } from "../ui/app-header";

export const dynamic = "force-dynamic";
export default async function NewPage() {
  const user = await requireAppUser("/novi");
  const company = await companyFor(user.userId);
  if (company?.status !== "approved") redirect("/");
  const usage = await db().prepare("SELECT COUNT(*) AS count FROM documents WHERE user_id=? AND month=? AND type='invoice'").bind(user.userId,currentMonth()).first<{count:number}>();
  return <div className="app-frame"><AppHeader user={user} hasCompany paid={paidActive(company)}/>
    <Editor isFree={!paidActive(company)} used={usage?.count ?? 0} vatRegistered={!!company.vat_registered} company={company}/></div>;
}
