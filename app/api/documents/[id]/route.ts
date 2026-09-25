import { apiError, companyFor, db, identity, sameOrigin, type DocumentRecord } from "@/lib/server";
import { documentInput } from "../route";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  const { id } = await context.params;
  try {
    const doc = await db().prepare("SELECT * FROM documents WHERE id=? AND user_id=?").bind(id, user.id).first<DocumentRecord>();
    if (!doc) return apiError("Dokument nije pronađen.", 404);
    return Response.json({ document: { ...doc, items: JSON.parse(doc.items_json), issuer: JSON.parse(doc.issuer_json) } });
  } catch (e) {
    console.error("Document read failed", e);
    return apiError("Dokument trenutno nije dostupan.", 500);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return apiError("Nevažeći zahtjev.", 403);
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  const { id } = await context.params;
  try {
    const company = await companyFor(user.id);
    if (!company || company.status !== "approved") return apiError("Podaci firme nisu dostupni.", 403);
    const old = await db().prepare("SELECT * FROM documents WHERE id=? AND user_id=?").bind(id, user.id).first<DocumentRecord>();
    if (!old) return apiError("Dokument nije pronađen.", 404);
    const issuer = JSON.parse(old.issuer_json) as {vatRegistered?:boolean};
    const input = documentInput(await request.json(), company.plan === "free", !!issuer.vatRegistered);
    const number = input.manualNumber || old.number;
    await db().prepare(`UPDATE documents SET type=?,title=?,number=?,issue_date=?,due_date=?,client_name=?,
      client_address=?,client_id=?,currency=?,items_json=?,notes=?,updated_at=? WHERE id=? AND user_id=?`)
      .bind(input.type,input.title,number,input.issueDate,input.dueDate,input.clientName,input.clientAddress,
        input.clientId,input.currency,JSON.stringify(input.items),input.notes,new Date().toISOString(),id,user.id).run();
    return Response.json({ id, number });
  } catch (e) {
    if (e instanceof Error && /UNIQUE constraint/.test(e.message)) return apiError("Broj dokumenta već postoji.", 409);
    if (e instanceof Error && !/D1|database|SQLITE|binding/i.test(e.message)) return apiError(e.message);
    console.error("Document update failed", e);
    return apiError("Izmjene nisu sačuvane.", 500);
  }
}
