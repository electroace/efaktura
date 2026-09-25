import { apiError, db, identity, sameOrigin, type CatalogItem } from "@/lib/server";
import { catalogInput } from "@/lib/catalog";

export async function GET() {
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  try {
    const rows = await db().prepare("SELECT * FROM catalog_items WHERE user_id=? ORDER BY name COLLATE NOCASE LIMIT 1000").bind(user.id).all<CatalogItem>();
    return Response.json({ items: rows.results });
  } catch (error) {
    console.error("Catalog list failed", error);
    return apiError("Stavke trenutno nisu dostupne.", 500);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError("Nevažeći zahtjev.", 403);
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  try {
    const c = catalogInput(await request.json());
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db().prepare(`INSERT INTO catalog_items
      (id,user_id,kind,name,description,sku,unit,price,vat,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id,user.id,c.kind,c.name,c.description,c.sku,c.unit,c.price,c.vat,now,now).run();
    return Response.json({ item: { ...c, id, user_id:user.id, created_at:now, updated_at:now } }, {status:201});
  } catch (error) {
    if (error instanceof Error && !/D1|database|SQLITE|binding/i.test(error.message)) return apiError(error.message);
    console.error("Catalog create failed", error);
    return apiError("Stavka nije sačuvana.", 500);
  }
}
