import type { AppUser } from "@/lib/app-auth";
import { signOutPath, supabaseConfigured } from "@/lib/app-auth";
import { isAdmin } from "@/lib/server";
import { BuyNow } from "./buy-now";

export function AppHeader({ user, hasCompany = false, paid = false }: { user: AppUser; hasCompany?: boolean; paid?: boolean }) {
  return <><header className="app-header">
    <a href="/" className="brand"><span className="brand-mark">e</span>faktura<span className="brand-dot">.</span>ba</a>
    <nav className="account-links" aria-label="Glavna navigacija">
      {hasCompany && <a href="/" className="nav-link">Dokumenti</a>}
      {hasCompany && <a href="/novi" className="nav-link">Novi dokument</a>}
      {hasCompany && <a href="/kupci" className="nav-link">Kupci</a>}
      {hasCompany && <a href="/stavke" className="nav-link">Roba i usluge</a>}
      {hasCompany && <a href="/postavke" className="nav-link">Postavke</a>}
      {isAdmin(user.email,user.userId) && <a href="/admin" className="nav-link">Administracija</a>}
      {hasCompany ? <BuyNow paid={paid}/> : <a href="/pretplata" className="header-upgrade">Kupi neograničenu verziju</a>}
      <span className="account-email">{user.email}</span>
      {supabaseConfigured() ? <form action={signOutPath()} method="post"><button type="submit" className="text-action">Odjava</button></form> : <a href={signOutPath()} target="_top">Odjava</a>}
    </nav>
  </header>{user.impersonating && <div className="impersonation-banner"><strong>Administratorski pregled: {user.email}</strong><span>Radite u konzoli ove firme.</span><form action="/api/admin/impersonate" method="post"><input type="hidden" name="mode" value="exit"/><button type="submit">Izađi iz konzole firme</button></form></div>}</>;
}
