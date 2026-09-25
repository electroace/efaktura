import { apiError, companyFor, db, identity, sameOrigin } from "@/lib/server";
import { billingReady, billingSettings, notifyAdmin, type PlanRequest } from "@/lib/billing";

export async function GET() {
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  try {
    const rows = await db().prepare("SELECT * FROM plan_requests WHERE user_id=? ORDER BY created_at DESC LIMIT 20").bind(user.id).all<PlanRequest>();
    return Response.json({ requests: rows.results });
  } catch (error) { console.error("Plan request list unavailable", error); return apiError("Zahtjevi trenutno nisu dostupni.", 500); }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError("Nevažeći zahtjev.", 403);
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  try {
    const company = await companyFor(user.id);
    if (!company || company.status !== "approved") return apiError("Prvo unesite podatke svoje firme.", 403);
    const existing = await db().prepare("SELECT * FROM plan_requests WHERE user_id=? AND status='pending'").bind(user.id).first<PlanRequest>();
    if (existing) return Response.json({ request: existing, existing: true });
    const issuer = await billingSettings();
    if (!billingReady(issuer)) return apiError("Predračuni još nisu dostupni. Administrator treba unijeti podatke izdavaoca.", 503);
    const amountCents = Math.round(company.price_bam * 100);
    if (!Number.isSafeInteger(amountCents) || amountCents < 1 || amountCents > 10_000_000) return apiError("Cijena paketa nije ispravna.", 500);
    const baseCents = Math.round(amountCents / 1.17);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const number = `PR-${now.slice(0,4)}-${id.slice(0,8).toUpperCase()}`;
    const customer = { name: company.name, address: company.address, city: company.city, postalCode: company.postal_code, jib: company.jib, vatId: company.vat_id, email: company.contact_email };
    await db().prepare(`INSERT INTO plan_requests
      (id,user_id,number,amount_cents,base_cents,vat_cents,issuer_json,customer_json,status,email_status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,user.id,number,amountCents,baseCents,amountCents-baseCents,
      JSON.stringify(issuer),JSON.stringify(customer),"pending","not_configured",now,now).run();
    const saved = await db().prepare("SELECT * FROM plan_requests WHERE id=? AND user_id=?").bind(id,user.id).first<PlanRequest>();
    if (!saved) throw new Error("Created request missing");
    const emailStatus = await notifyAdmin(saved, company.name, user.email);
    await db().prepare("UPDATE plan_requests SET email_status=? WHERE id=?").bind(emailStatus,id).run();
    return Response.json({ request: { ...saved, email_status: emailStatus }, existing: false }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && /UNIQUE constraint/.test(error.message)) {
      const pending = await db().prepare("SELECT * FROM plan_requests WHERE user_id=? AND status='pending'").bind(user.id).first<PlanRequest>();
      if (pending) return Response.json({ request: pending, existing: true });
    }
    console.error("Plan request failed", error);
    return apiError("Zahtjev nije sačuvan. Pokušajte ponovo.", 500);
  }
}
