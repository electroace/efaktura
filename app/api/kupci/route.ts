import { apiError, db, identity, sameOrigin, type Customer } from "@/lib/server";
import { customerInput } from "@/lib/catalog";

export async function GET() {
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  try {
    const rows = await db().prepare("SELECT * FROM customers WHERE user_id=? ORDER BY name COLLATE NOCASE LIMIT 1000").bind(user.id).all<Customer>();
    return Response.json({ customers: rows.results });
  } catch (error) {
    console.error("Customer list failed", error);
    return apiError("Kupci trenutno nisu dostupni.", 500);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError("Nevažeći zahtjev.", 403);
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  try {
    const c = customerInput(await request.json());
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db().prepare(`INSERT INTO customers
      (id,user_id,name,address,city,postal_code,jib,vat_id,email,phone,contact_person,contact_email,contact_phone,notes,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id,user.id,c.name,c.address,c.city,c.postal_code,c.jib,c.vat_id,c.email,c.phone,
        c.contact_person,c.contact_email,c.contact_phone,c.notes,now,now).run();
    return Response.json({ customer: { ...c, id, user_id:user.id, created_at:now, updated_at:now } }, {status:201});
  } catch (error) {
    if (error instanceof Error && !/D1|database|SQLITE|binding/i.test(error.message)) return apiError(error.message);
    console.error("Customer create failed", error);
    return apiError("Kupac nije sačuvan.", 500);
  }
}
