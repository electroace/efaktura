import { apiError, clean, companyFor, currentMonth, db, identity, paidActive, sameOrigin } from "@/lib/server";

type Item = { name: string; description: string; sku: string; quantity: number; unit: string; price: number; vat: number };

function documentInput(body: Record<string, unknown>, free: boolean, vatRegistered: boolean) {
  const type = clean(body.type, 20);
  const title = type === "custom" ? clean(body.title, 100) : type === "offer" ? "Ponuda" : "Faktura";
  const items = Array.isArray(body.items) ? body.items : [];
  const normalized: Item[] = items.map((value: unknown) => {
    const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
    return {name:clean(row.name,180),description:clean(row.description,500),sku:clean(row.sku,60),
      quantity:Number(row.quantity),unit:clean(row.unit,24)||"kom",price:Number(row.price),
      vat:vatRegistered?Number(row.vat):0};
  });
  if (!["invoice", "offer", "custom"].includes(type) || !title) throw new Error("Izaberite vrstu i naziv dokumenta.");
  if (!normalized.length || normalized.length > (free && type === "invoice" ? 5 : 100)) throw new Error(free && type === "invoice" ? "Besplatni paket dopušta najviše 5 stavki po fakturi." : "Dokument može imati najviše 100 stavki.");
  if (normalized.some(i => !i.name || !Number.isFinite(i.quantity) || i.quantity <= 0 || i.quantity > 100000 ||
      !Number.isFinite(i.price) || i.price < 0 || i.price > 100000000 ||
      !Number.isFinite(i.vat) || i.vat < 0 || i.vat > 100)) throw new Error("Provjerite stavke, količine, cijene i PDV.");
  const issueDate = clean(body.issueDate, 10);
  const dueDate = clean(body.dueDate, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate) || (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate))) throw new Error("Unesite ispravan datum.");
  const clientName = clean(body.clientName, 180);
  if (!clientName) throw new Error("Unesite kupca.");
  const manualNumber = clean(body.number, 60);
  if (manualNumber && !/^[\p{L}\p{N}][\p{L}\p{N}\s/._-]{0,59}$/u.test(manualNumber)) throw new Error("Broj dokumenta sadrži nedopuštene znakove.");
  return {
    type, title, items: normalized, issueDate, dueDate, clientName,
    clientAddress: clean(body.clientAddress, 300), clientId: clean(body.clientId, 50),
    clientContact: clean(body.clientContact, 120),
    showClientContact: body.showClientContact === true, showIssuerContact: body.showIssuerContact === true,
    fiscalNumber: clean(body.fiscalNumber, 80),
    currency: ["KM", "EUR", "USD"].includes(String(body.currency)) ? String(body.currency) : "KM",
    notes: clean(body.notes, 1600), manualNumber,
  };
}

export async function GET() {
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  try {
    const rows = await db().prepare("SELECT id,type,title,number,issue_date,client_name,created_at FROM documents WHERE user_id=? ORDER BY created_at DESC LIMIT 200").bind(user.id).all();
    return Response.json({ documents: rows.results });
  } catch (e) {
    console.error("Documents list failed", e);
    return apiError("Dokumenti trenutno nisu dostupni.", 500);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError("Nevažeći zahtjev.", 403);
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  try {
    const company = await companyFor(user.id);
    if (!company || company.status !== "approved") return apiError("Podaci firme nisu dostupni.", 403);
    const input = documentInput(await request.json(), !paidActive(company), !!company.vat_registered);
    const year = input.issueDate.slice(0, 4);
    const prefix = input.type === "invoice" ? "F" : input.type === "offer" ? "P" : "D";
    const start = `${prefix}-${year}-`;
    const next = await db().prepare("SELECT COALESCE(MAX(CAST(SUBSTR(number, ?) AS INTEGER)),0)+1 AS seq FROM documents WHERE user_id=? AND number LIKE ?")
      .bind(start.length + 1, user.id, `${start}%`).first<{ seq: number }>();
    const number = input.manualNumber || `${start}${String(next?.seq ?? 1).padStart(4, "0")}`;
    const now = new Date().toISOString();
    const month = currentMonth();
    const id = crypto.randomUUID();
    const issuer = {
      name: company.name, address: company.address, city: company.city, postalCode: company.postal_code,
      jib: company.jib, vatId: company.vat_id, vatRegistered: !!company.vat_registered,
      iban: company.iban, bank: company.bank, phone: company.phone, email: company.contact_email,
      logoKey: company.logo_key, contactPerson: company.contact_person,
    };
    const result = await db().prepare(`INSERT INTO documents
      (id,user_id,type,title,number,issue_date,due_date,client_name,client_address,client_id,client_contact,
       show_client_contact,show_issuer_contact,fiscal_number,currency,items_json,issuer_json,notes,month,created_at,updated_at)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      WHERE ? != 'invoice' OR ? = 1 OR
        (SELECT COUNT(*) FROM documents WHERE user_id=? AND month=? AND type='invoice') < 3`)
      .bind(id,user.id,input.type,input.title,number,input.issueDate,input.dueDate,input.clientName,input.clientAddress,
        input.clientId,input.clientContact,input.showClientContact?1:0,input.showIssuerContact?1:0,input.fiscalNumber,
        input.currency,JSON.stringify(input.items),JSON.stringify(issuer),input.notes,month,now,now,
        input.type,paidActive(company)?1:0,user.id,month).run();
    if (!result.meta.changes) return apiError("Iskoristili ste 3 fakture ovog mjeseca. Ponude i drugi dokumenti su i dalje dostupni.", 403);
    return Response.json({ id, number }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && /UNIQUE constraint/.test(e.message)) return apiError("Broj dokumenta već postoji. Izaberite drugi ili pokušajte ponovo.", 409);
    if (e instanceof Error && !/D1|database|SQLITE|binding/i.test(e.message)) return apiError(e.message);
    console.error("Document creation failed", e);
    return apiError("Dokument nije sačuvan. Pokušajte ponovo.", 500);
  }
}

export { documentInput };
