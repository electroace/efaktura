import { notFound } from "next/navigation";
import { requireAppUser } from "@/lib/app-auth";
import { companyFor, db, paidActive, type DocumentRecord } from "@/lib/server";
import { Editor } from "../../ui/editor";
import { AppHeader } from "../../ui/app-header";

export const dynamic = "force-dynamic";
export default async function DocumentPage({params}:{params:Promise<{id:string}>}) {
  const user = await requireAppUser("/");
  const {id} = await params;
  const [company,doc] = await Promise.all([
    companyFor(user.userId),
    db().prepare("SELECT * FROM documents WHERE id=? AND user_id=?").bind(id,user.userId).first<DocumentRecord>(),
  ]);
  if (!doc || !company) notFound();
  return <div className="app-frame"><AppHeader user={user} hasCompany paid={paidActive(company)}/>
    <Editor isFree={!paidActive(company)} used={0} vatRegistered={!!company.vat_registered} company={company}
      initial={{ id:doc.id,type:doc.type,title:doc.title,number:doc.number,issueDate:doc.issue_date,dueDate:doc.due_date,
        clientName:doc.client_name,clientAddress:doc.client_address,clientId:doc.client_id,currency:doc.currency,
        items:JSON.parse(doc.items_json),notes:doc.notes,issuer:JSON.parse(doc.issuer_json) }}/></div>;
}
