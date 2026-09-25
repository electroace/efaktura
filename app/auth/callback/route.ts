import { env } from "cloudflare:workers";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { safeReturnPath, supabaseConfigured } from "@/lib/app-auth";

export async function GET(request: NextRequest) {
  if (!supabaseConfigured()) return NextResponse.redirect(new URL("/prijava", request.url));
  const params = request.nextUrl.searchParams;
  const destination = safeReturnPath(params.get("next"));
  const response = NextResponse.redirect(new URL(destination, request.url));
  const client = createServerClient(env.SUPABASE_URL!, env.SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: values => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) },
  });
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const result = code ? await client.auth.exchangeCodeForSession(code)
    : tokenHash && (type === "signup" || type === "recovery" || type === "email")
      ? await client.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Nevažeća poveznica.") };
  if (result.error) return NextResponse.redirect(new URL("/prijava?error=link", request.url));
  return response;
}
