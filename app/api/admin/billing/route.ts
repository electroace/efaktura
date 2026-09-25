import { apiError, clean, db, identity, isAdmin, sameOrigin } from "@/lib/server";
import { billingReady, billingSettings } from "@/lib/billing";

export async function GET() {
  const user = await identity();
  if (!user || !isAdmin(user.email)) return apiError("Zabranjen pristup.", 403);
  try {
    const settings = await billingSettings();
    return Response.json({ settings, ready: billingReady(settings) });
  } catch (error) { console.error("Billing settings unavailable", error); return apiError("Postavke nisu dostupne.", 500); }
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return apiError("Nevažeći zahtjev.", 403);
  const user = await identity();
  if (!user || !isAdmin(user.email)) return apiError("Zabranjen pristup.", 403);
  try {
    const body = await request.json() as Record<string, unknown>;
    const settings = {
      name: clean(body.name, 180), address: clean(body.address, 250), city: clean(body.city, 120),
      postal_code: clean(body.postal_code, 20), jib: clean(body.jib, 32), vat_id: clean(body.vat_id, 32),
      iban: clean(body.iban, 60), bank: clean(body.bank, 120), email: clean(body.email, 120),
    };
    if (!billingReady(settings) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) return apiError("Unesite sve podatke izdavaoca predračuna, uključujući PDV broj i račun za uplatu.");
    await db().prepare(`INSERT INTO billing_settings (id,name,address,city,postal_code,jib,vat_id,iban,bank,email,updated_at)
      VALUES (1,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,address=excluded.address,
      city=excluded.city,postal_code=excluded.postal_code,jib=excluded.jib,vat_id=excluded.vat_id,
      iban=excluded.iban,bank=excluded.bank,email=excluded.email,updated_at=excluded.updated_at`)
      .bind(settings.name,settings.address,settings.city,settings.postal_code,settings.jib,settings.vat_id,
        settings.iban,settings.bank,settings.email,new Date().toISOString()).run();
    return Response.json({ ok: true });
  } catch (error) { console.error("Billing settings update failed", error); return apiError("Postavke nisu sačuvane.", 500); }
}
