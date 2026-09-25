import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "@/app/chatgpt-auth";

export type AppUser = { userId: string; email: string; displayName: string };

export function supabaseConfigured() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY);
}

export function supabasePublicConfig() {
  return { url: env.SUPABASE_URL ?? "", key: env.SUPABASE_PUBLISHABLE_KEY ?? "" };
}

export async function getAppUser(): Promise<AppUser | null> {
  if (!supabaseConfigured()) return getChatGPTUser();
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
  return { userId: user.id, email: user.email, displayName: user.user_metadata?.full_name ?? user.email };
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
  return supabaseConfigured() ? `/prijava?next=${encodeURIComponent(safeReturnPath(returnTo))}` : chatGPTSignInPath(returnTo);
}

export function signOutPath() {
  return supabaseConfigured() ? "/auth/signout" : chatGPTSignOutPath("/");
}
