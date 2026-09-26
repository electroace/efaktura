import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export type AppUser = { userId: string; email: string; displayName: string;
  registration?: {fullName:string;phone:string;companyName:string;address:string;city:string;jib:string};
  impersonating?: boolean; adminEmail?: string };

export function supabaseConfigured() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY);
}

export function supabasePublicConfig() {
  return { url: env.SUPABASE_URL ?? "", key: env.SUPABASE_PUBLISHABLE_KEY ?? "" };
}

export async function getAppUser(): Promise<AppUser | null> {
  if (!supabaseConfigured()) return null;
  const cookieStore = await cookies();
  const client = createServerClient(env.SUPABASE_URL!, env.SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: values => {
        // A Server Component cannot always write refreshed cookies. The browser
        // client keeps them fresh; route handlers can write them directly.
        try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Read-only Server Component render. */ }
      },
    },
  });
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user?.email || !user.email_confirmed_at) return null;
  const fields = user.user_metadata ?? {};
  const field = (key:string) => typeof fields[key] === "string" ? fields[key].slice(0,250) : "";
  return { userId: user.id, email: user.email, displayName: field("full_name") || user.email,
    registration: {fullName:field("full_name"),phone:field("contact_phone"),companyName:field("company_name"),
      address:field("company_address"),city:field("company_city"),jib:field("company_jib")} };
}

export async function requireAppUser(returnTo: string): Promise<AppUser> {
  const user = await getAppUser();
  if (user) return user;
  redirect(signInPath(returnTo));
}

export function safeReturnPath(path: string | null) {
  return path?.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : "/";
}

export function signInPath(returnTo: string) {
  return `/prijava?next=${encodeURIComponent(safeReturnPath(returnTo))}`;
}

export function signOutPath() {
  return "/auth/signout";
}
