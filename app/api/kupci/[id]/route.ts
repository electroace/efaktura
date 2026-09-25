import { apiError, db, identity, sameOrigin, type Customer } from "@/lib/server";
import { customerInput } from "@/lib/catalog";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return apiError("Nevažeći zahtjev.", 403);
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  const { id } = await params;
  try {
    const c = customerInput(await request.json());
    const now = new Date().toISOString();
    const result = await db().prepare(`UPDATE customers SET name=?,address=?,city=?,postal_code=?,jib=?,vat_id=?,
      email=?,phone=?,contact_person=?,contact_email=?,contact_phone=?,notes=?,updated_at=? WHERE id=? AND user_id=?`)
      .bind(c.name,c.address,c.city,c.postal_code,c.jib,c.vat_id,c.email,c.phone,
        c.contact_person,c.contact_email,c.contact_phone,c.notes,now,id,user.id).run();
    if (!result.meta.changes) return apiError("Kupac nije pronađen.", 404);
    const updated = await db().prepare("SELECT * FROM customers WHERE id=? AND user_id=?").bind(id,user.id).first<Customer>();
    return Response.json({customer:updated});
  } catch (error) {
    if (error instanceof Error && !/D1|database|SQLITE|binding/i.test(error.message)) return apiError(error.message);
    console.error("Customer update failed", error);
    return apiError("Kupac nije sačuvan.", 500);
  }
}
