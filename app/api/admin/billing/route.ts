import { apiError, realIdentity, isAdmin, sameOrigin } from "@/lib/server";
import { billingReady, billingSettings } from "@/lib/billing";

export async function GET() {
  const user = await realIdentity();
  if (!user || !isAdmin(user.email,user.id)) return apiError("Zabranjen pristup.", 403);
  try {
    const settings = await billingSettings();
    return Response.json({ settings, ready: billingReady(settings) });
  } catch (error) { console.error("Billing settings unavailable", error); return apiError("Postavke nisu dostupne.", 500); }
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return apiError("Nevažeći zahtjev.", 403);
  const user = await realIdentity();
  if (!user || !isAdmin(user.email,user.id)) return apiError("Zabranjen pristup.", 403);
  return apiError("Podatke izdavaoca promijenite u Postavkama administratorske firme.", 410);
}
