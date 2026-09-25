import { env } from "cloudflare:workers";
import { apiError, companyFor, db, identity, sameOrigin, type DocumentRecord } from "@/lib/server";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError("Nevažeći zahtjev.", 403);
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  const company = await companyFor(user.id);
  if (!company) return apiError("Prvo unesite podatke firme.");
  if (!env.BUCKET) return apiError("Pohrana logotipa nije dostupna.", 503);
  const form = await request.formData();
  const file = form.get("logo");
  if (!(file instanceof File)) return apiError("Izaberite sliku.");
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 1024 * 1024 || !file.size) {
    return apiError("Logo mora biti PNG, JPG ili WebP do 1 MB.");
  }
  const bytes = await file.arrayBuffer();
  const key = `logos/${user.id}/${crypto.randomUUID()}`;
  try {
    await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: file.type } });
    await db().prepare("UPDATE companies SET logo_key=?, updated_at=? WHERE user_id=?").bind(key, new Date().toISOString(), user.id).run();
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Logo upload failed", e);
    return apiError("Logo nije sačuvan. Pokušajte ponovo.", 500);
  }
}

export async function GET(request: Request) {
  const user = await identity();
  if (!user) return apiError("Prijavite se.", 401);
  const company = await companyFor(user.id);
  if (!env.BUCKET) return new Response(null, { status: 404 });
  let key = company?.logo_key;
  const documentId = new URL(request.url).searchParams.get("document");
  if (documentId) {
    const doc = await db().prepare("SELECT issuer_json FROM documents WHERE id=? AND user_id=?").bind(documentId,user.id).first<Pick<DocumentRecord,"issuer_json">>();
    if (!doc) return new Response(null, { status: 404 });
    key = (JSON.parse(doc.issuer_json) as {logoKey?:string}).logoKey ?? null;
  }
  if (!key) return new Response(null, { status: 404 });
  const logo = await env.BUCKET.get(key);
  if (!logo) return new Response(null, { status: 404 });
  return new Response(logo.body, { headers: {
    "content-type": logo.httpMetadata?.contentType ?? "image/png",
    "cache-control": "private, max-age=300",
    "x-content-type-options": "nosniff",
  } });
}
