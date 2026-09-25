import { apiError, db, identity, sameOrigin, type CatalogItem } from "@/lib/server";
import { catalogInput } from "@/lib/catalog";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return apiError("Nevažeći zahtjev.", 403);
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  const { id } = await params;
  try {
    const c = catalogInput(await request.json());
    const now = new Date().toISOString();
    const result = await db().prepare(`UPDATE catalog_items SET kind=?,name=?,description=?,sku=?,unit=?,price=?,vat=?,updated_at=?
      WHERE id=? AND user_id=?`).bind(c.kind,c.name,c.description,c.sku,c.unit,c.price,c.vat,now,id,user.id).run();
    if (!result.meta.changes) return apiError("Stavka nije pronađena.", 404);
    const updated = await db().prepare("SELECT * FROM catalog_items WHERE id=? AND user_id=?").bind(id,user.id).first<CatalogItem>();
    return Response.json({item:updated});
  } catch (error) {
    if (error instanceof Error && !/D1|database|SQLITE|binding/i.test(error.message)) return apiError(error.message);
    console.error("Catalog update failed", error);
    return apiError("Stavka nije sačuvana.", 500);
  }
}
