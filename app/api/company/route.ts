import { companyFor, clean, db, identity, apiError, sameOrigin } from "@/lib/server";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError("Nevažeći zahtjev.", 403);
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  try {
    const data = await request.json() as Record<string, unknown>;
    const name = clean(data.name, 180);
    const address = clean(data.address, 250);
    const city = clean(data.city, 120);
    const jib = clean(data.jib, 32);
    if (!name || !address || !city || !jib) return apiError("Unesite naziv, adresu, grad i JIB.");
    const existing = await companyFor(user.id);
    const now = new Date().toISOString();
    const values = [
      name, address, city, clean(data.postalCode, 20), jib, clean(data.vatId, 32),
      data.vatRegistered === true ? 1 : 0, clean(data.iban, 60), clean(data.bank, 120),
      clean(data.phone, 40), clean(data.contactEmail, 120) || user.email,
      clean(data.contactPerson, 120), clean(data.defaultNote, 1600),
      clean(data.responsiblePerson, 120),
      data.showSignatureLine === true ? 0 : data.electronicNotice === false ? 0 : 1,
      data.showSignatureLine === true ? 1 : 0,
      now, user.id
    ];
    if (existing) {
      await db().prepare(`UPDATE companies SET name=?, address=?, city=?, postal_code=?, jib=?, vat_id=?,
        vat_registered=?, iban=?, bank=?, phone=?, contact_email=?, contact_person=?, default_note=?,
        responsible_person=?, electronic_notice=?, show_signature_line=?, updated_at=? WHERE user_id=?`).bind(...values).run();
    } else {
      await db().prepare(`INSERT INTO companies
        (name,address,city,postal_code,jib,vat_id,vat_registered,iban,bank,phone,contact_email,contact_person,
         default_note,responsible_person,electronic_notice,show_signature_line,updated_at,user_id,email,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(...values, user.email, now).run();
    }
    return Response.json({ ok: true, status: existing?.status ?? "approved" });
  } catch (e) {
    console.error("Company save failed", e);
    return apiError("Podaci trenutno nisu sačuvani. Pokušajte ponovo.", 500);
  }
}
