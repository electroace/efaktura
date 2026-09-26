import { NextResponse } from "next/server";
import { apiError, companyFor, isAdmin, realIdentity, sameOrigin } from "@/lib/server";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError("Nevažeći zahtjev.", 403);
  const admin = await realIdentity();
  if (!admin || !isAdmin(admin.email,admin.id)) return apiError("Zabranjen pristup.", 403);
  const data = request.headers.get("content-type")?.includes("application/json")
    ? await request.json() as {userId?:unknown;mode?:unknown}
    : Object.fromEntries(await request.formData()) as {userId?:unknown;mode?:unknown};
  if (data.mode === "exit") {
    const response = NextResponse.redirect(new URL("/admin", request.url), { status:303 });
    response.cookies.set("efaktura-acting-as", "", {path:"/",maxAge:0});
    return response;
  }
  const id = typeof data.userId === "string" ? data.userId : "";
  if (!id || id === admin.id || id.length > 200) return apiError("Izaberite drugu firmu.");
  const target = await companyFor(id);
  if (!target || target.status !== "approved") return apiError("Firma nije dostupna.", 404);
  const response = NextResponse.json({ok:true,company:target.name});
  response.cookies.set("efaktura-acting-as", id, {httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:30*60});
  return response;
}
