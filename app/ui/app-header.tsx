import { ArrowUpRight } from "lucide-react";
import type { AppUser } from "@/lib/app-auth";
import { signOutPath, supabaseConfigured } from "@/lib/app-auth";
import { isAdmin } from "@/lib/server";

export function AppHeader({ user, hasCompany = false, paid = false }: { user: AppUser; hasCompany?: boolean; paid?: boolean }) {
  return <header className="app-header">
    <a href="/" className="brand"><span className="brand-mark">e</span>faktura<span className="brand-dot">.</span>ba</a>
    <nav className="account-links" aria-label="Glavna navigacija">
      {hasCompany && <a href="/" className="nav-link">Dokumenti</a>}
      {hasCompany && <a href="/novi" className="nav-link">Novi dokument</a>}
      {hasCompany && <a href="/kupci" className="nav-link">Kupci</a>}
      {hasCompany && <a href="/stavke" className="nav-link">Roba i usluge</a>}
      {hasCompany && <a href="/postavke" className="nav-link">Postavke</a>}
      {isAdmin(user.email) && <a href="/admin" className="nav-link">Administracija</a>}
      <a href="/pretplata" className="header-upgrade">{paid ? "Produži paket" : "Neograničene fakture"}<ArrowUpRight size={15}/></a>
      <span className="account-email">{user.email}</span>
      {supabaseConfigured() ? <form action={signOutPath()} method="post"><button type="submit" className="text-action">Odjava</button></form> : <a href={signOutPath()} target="_top">Odjava</a>}
    </nav>
  </header>;
}
