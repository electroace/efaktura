import { apiError, clean, db, realIdentity, isAdmin, sameOrigin } from "@/lib/server";

export async function GET() {
  const user = await realIdentity();
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
  const user = await realIdentity();
  if (!user || !isAdmin(user.email)) return apiError("Zabranjen pristup.", 403);
  try {
    const data = await request.json() as Record<string, unknown>;
    const userId = clean(data.userId, 200);
    const price = Number(data.priceBam);
    if (!userId || !Number.isFinite(price) || price <= 0 || price > 100000 || Math.abs(Math.round(price * 100) - price * 100) > 0.000001) {
      return apiError("Nevažeći podaci.");
    }
    const result = await db().prepare("UPDATE companies SET price_bam=?, updated_at=? WHERE user_id=?")
      .bind(price, new Date().toISOString(), userId).run();
    if (!result.meta.changes) return apiError("Firma nije pronađena.", 404);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Admin update failed", e);
    return apiError("Izmjene nisu sačuvane.", 500);
  }
}
