import { addCalendarMonth, apiError, clean, db, realIdentity, isAdmin, sameOrigin } from "@/lib/server";
import { notifyAdmin, type PlanRequest } from "@/lib/billing";

export async function GET() {
  const user = await realIdentity();
  if (!user || !isAdmin(user.email)) return apiError("Zabranjen pristup.", 403);
  try {
    const rows = await db().prepare(`SELECT r.*, c.name AS customer_name, c.email AS customer_email
      FROM plan_requests r JOIN companies c ON c.user_id=r.user_id
      ORDER BY CASE WHEN r.status='pending' THEN 0 ELSE 1 END, r.created_at DESC LIMIT 200`).all<PlanRequest & {customer_name:string;customer_email:string}>();
    return Response.json({ requests: rows.results });
  } catch (error) { console.error("Admin requests unavailable", error); return apiError("Zahtjevi nisu dostupni.", 500); }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return apiError("Nevažeći zahtjev.", 403);
  const user = await realIdentity();
  if (!user || !isAdmin(user.email)) return apiError("Zabranjen pristup.", 403);
  try {
    const data = await request.json() as Record<string, unknown>;
    const id = clean(data.id, 80);
    const action = clean(data.action, 20);
    if (!id || !["activate", "decline", "resend"].includes(action)) return apiError("Nevažeći zahtjev.");
    const item = await db().prepare("SELECT * FROM plan_requests WHERE id=?").bind(id).first<PlanRequest>();
    if (!item || item.status !== "pending") return apiError("Zahtjev nije na čekanju.", 409);
    const now = new Date().toISOString();
    if (action === "resend") {
      const company = await db().prepare("SELECT name,email FROM companies WHERE user_id=?").bind(item.user_id).first<{name:string;email:string}>();
      if (!company) return apiError("Firma nije pronađena.", 404);
      const emailStatus = await notifyAdmin(item, company.name, company.email);
      await db().prepare("UPDATE plan_requests SET email_status=? WHERE id=?").bind(emailStatus,id).run();
      return Response.json({ ok: emailStatus === "sent", emailStatus });
    } else if (action === "decline") {
      const result = await db().prepare("UPDATE plan_requests SET status='declined',updated_at=? WHERE id=? AND status='pending'").bind(now,id).run();
      if (!result.meta.changes) return apiError("Zahtjev je već obrađen.", 409);
    } else {
      const company = await db().prepare("SELECT paid_until FROM companies WHERE user_id=?").bind(item.user_id).first<{paid_until:string|null}>();
      if (!company) return apiError("Firma nije pronađena.", 404);
      const start = company.paid_until && company.paid_until > now ? company.paid_until : now;
      const until = addCalendarMonth(start);
      const changes = await db().batch([
        db().prepare(`UPDATE companies SET plan='paid',paid_until=?,updated_at=? WHERE user_id=?
          AND EXISTS (SELECT 1 FROM plan_requests WHERE id=? AND user_id=? AND status='pending')`).bind(until,now,item.user_id,id,item.user_id),
        db().prepare("UPDATE plan_requests SET status='activated',updated_at=? WHERE id=? AND status='pending'").bind(now,id),
      ]);
      if (!changes[0].meta.changes || !changes[1].meta.changes) return apiError("Zahtjev je već obrađen.", 409);
    }
    return Response.json({ ok: true });
  } catch (error) { console.error("Admin request update failed", error); return apiError("Zahtjev nije ažuriran.", 500); }
}
