import { apiError, clean, db, identity, isAdmin, sameOrigin } from "@/lib/server";

export async function GET() {
  const user = await identity();
  if (!user || !isAdmin(user.email)) return apiError("Zabranjen pristup.", 403);
  try {
    const rows = await db().prepare("SELECT * FROM companies ORDER BY created_at DESC").all();
    return Response.json({ companies: rows.results });
  } catch (e) {
    console.error("Admin list failed", e);
    return apiError("Lista trenutno nije dostupna.", 500);
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return apiError("Nevažeći zahtjev.", 403);
  const user = await identity();
  if (!user || !isAdmin(user.email)) return apiError("Zabranjen pristup.", 403);
  try {
    const data = await request.json() as Record<string, unknown>;
    const userId = clean(data.userId, 200);
    const plan = clean(data.plan, 20);
    const price = Number(data.priceBam);
    if (!userId || !["free", "paid"].includes(plan) || !Number.isInteger(price) || price < 0 || price > 100000) {
      return apiError("Nevažeći podaci.");
    }
    const result = await db().prepare("UPDATE companies SET plan=?, price_bam=?, updated_at=? WHERE user_id=?")
      .bind(plan, price, new Date().toISOString(), userId).run();
    if (!result.meta.changes) return apiError("Firma nije pronađena.", 404);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Admin update failed", e);
    return apiError("Izmjene nisu sačuvane.", 500);
  }
}
