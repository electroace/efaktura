import { env } from "cloudflare:workers";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { sameOrigin } from "@/lib/server";
import { supabaseConfigured } from "@/lib/app-auth";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return new Response("Nevažeći zahtjev.", { status: 403 });
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.set("efaktura-acting-as", "", { path:"/", maxAge:0 });
  if (!supabaseConfigured()) return response;
  const client = createServerClient(env.SUPABASE_URL!, env.SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: values => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) },
  });
  await client.auth.signOut();
  return response;
}
