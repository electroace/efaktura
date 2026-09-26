import { ArrowRight, ArrowUpRight, Check, FileCheck2, FileText, Infinity as InfinityIcon, Layers3, LockKeyhole, Plus, Sparkles } from "lucide-react";

const signup = "/prijava?mode=signup";

export function PublicLanding() {
  return <main className="marketing-page">
    <header className="marketing-header">
      <a className="brand" href="/"><span className="brand-mark">e</span>faktura<span className="brand-dot">.</span>ba</a>
      <nav aria-label="Navigacija"><a href="#mogucnosti">Mogućnosti</a><a href="#paketi">Paketi</a><a href="/prijava">Prijava</a><a className="marketing-nav-cta" href={signup}>Počni besplatno <ArrowUpRight size={15}/></a></nav>
    </header>

    <section className="marketing-hero">
      <div className="marketing-hero-copy">
        <span className="marketing-pill"><Sparkles size={15}/> Fakture bez komplikacija</span>
        <h1>Faktura spremna <em>dok je posao još svjež.</em></h1>
        <p>Izradite fakture, ponude i druge poslovne dokumente na jednom mjestu. Podaci vaše firme su spremljeni, brojevi dokumenata su pod kontrolom, a PDF i Word su uvijek pri ruci.</p>
        <div className="marketing-actions"><a className="marketing-button" href={signup}>Otvori besplatni nalog <ArrowRight size={18}/></a><a className="marketing-text-link" href="#paketi">Pogledaj pakete <ArrowRight size={16}/></a></div>
        <div className="marketing-trust"><span><Check size={15}/> Bez kartice</span><span><Check size={15}/> Početak besplatno</span><span><Check size={15}/> Podaci samo vašeg naloga</span></div>
      </div>
      <div className="marketing-product" aria-label="Primjer pregleda aplikacije">
        <div className="product-window"><div className="product-window-top"><div className="product-window-dots"><i/><i/><i/></div><span>Radni prostor · eFaktura</span><span className="product-window-avatar">e</span></div>
          <div className="product-window-body"><div className="product-demo-heading"><div><small>PREGLED POSLOVANJA</small><h2>Vaši dokumenti</h2><p>Sve na jednom mjestu, spremno za slanje.</p></div><span><Plus size={15}/> Novi dokument</span></div>
            <div className="product-demo-stats"><div><small>Dokumenti ovog mjeseca</small><strong>2 <i>/ 3</i></strong><span>Besplatni paket</span></div><div><small>Dokumenti</small><strong>08</strong><span>Fakture i ponude</span></div><div><small>Vaš logo</small><strong><FileCheck2 size={26}/></strong><span>Na svakom dokumentu</span></div></div>
            <div className="product-demo-list"><div className="product-demo-list-head"><strong>Nedavni dokumenti</strong><span>Pregled →</span></div><div><span className="product-demo-icon"><FileText size={15}/></span><span>Faktura F-2026-0002<small>Usluge · danas</small></span><b>1.250,00 KM</b></div><div><span className="product-demo-icon"><Layers3 size={15}/></span><span>Ponuda P-2026-0001<small>Novi projekat · jučer</small></span><b>3.400,00 KM</b></div></div>
          </div>
        </div>
        <div className="product-floating"><span><Check size={17}/></span><div><strong>Spremno za izvoz</strong><small>PDF i Word za nekoliko sekundi</small></div></div>
      </div>
    </section>

    <section id="mogucnosti" className="marketing-features"><div className="marketing-section-title"><span className="marketing-kicker">KAKO RADI</span><h2>Manje administracije.<br/>Više vremena za posao.</h2><p>Otvorite nalog, dodajte firmu i počnite izrađivati dokumente.</p></div><div className="marketing-feature-grid"><article><span><FileText size={22}/></span><h3>Jedan unos, svi dokumenti</h3><p>Podaci firme i logo automatski se prikazuju na novim fakturama, ponudama i dokumentima koje sami imenujete.</p></article><article><span><Layers3 size={22}/></span><h3>Brojevi po vašoj mjeri</h3><p>Prepustite numeraciju aplikaciji ili sami upišite broj koji odgovara vašem načinu rada.</p></article><article><span><LockKeyhole size={22}/></span><h3>Vaš privatni prostor</h3><p>Svaki nalog pristupa vlastitim dokumentima. Sačuvane dokumente možete otvoriti, štampati ili preuzeti u Wordu.</p></article></div></section>

    <section id="paketi" className="marketing-pricing"><div className="marketing-section-title"><span className="marketing-kicker">JEDNOSTAVNE CIJENE</span><h2>Počnite besplatno.<br/>Rastite bez ograničenja.</h2><p>Pakete možete birati kada vama odgovara.</p></div><div className="marketing-plan-grid">
      <article className="marketing-plan"><div className="marketing-plan-head"><span>Za početak</span><h3>Besplatno</h3><p>Za povremene fakture, ponude i druge dokumente.</p></div><div className="marketing-price">0 KM <small>/ mjesečno</small></div><a href={signup} className="marketing-plan-link">Registruj se besplatno <ArrowRight size={17}/></a><ul><li><Check size={17}/> Do 3 dokumenta mjesečno, bilo koje vrste</li><li><Check size={17}/> Do 5 stavki po dokumentu</li><li><Check size={17}/> Fakture, ponude i vlastiti nazivi</li><li><Check size={17}/> Logo firme, PDF i Word</li></ul></article>
      <article className="marketing-plan marketing-plan-paid"><div className="marketing-plan-badge"><InfinityIcon size={16}/> Više prostora za posao</div><div className="marketing-plan-head"><span>Za redovan rad</span><h3>Neograničeno</h3><p>Dokumenti bez mjesečnog limita i više stavki na dokumentu.</p></div><div className="marketing-price">22 KM <small>/ mjesečno, s PDV-om</small></div><a href={signup} className="marketing-plan-link">Kupi neograničenu verziju <ArrowRight size={17}/></a><ul><li><Check size={17}/> Neograničen broj dokumenata mjesečno</li><li><Check size={17}/> Do 100 stavki po dokumentu</li><li><Check size={17}/> Ponude i drugi dokumenti</li><li><Check size={17}/> Predračun odmah nakon zahtjeva</li></ul><p className="marketing-plan-note">Plaćeni pristup se uključuje nakon evidentirane uplate. Administrator može odrediti posebnu cijenu za vašu firmu.</p></article>
    </div></section>
    <section className="marketing-final"><div><span className="marketing-kicker">SPREMNI ZA PRVI DOKUMENT?</span><h2>Radite jednostavnije već danas.</h2><p>Registracija je besplatna. Plaćeni paket uključite kad vam zatreba.</p></div><a href={signup} className="marketing-button">Počni besplatno <ArrowRight size={18}/></a></section>
    <footer className="marketing-footer"><a href="/" className="brand"><span className="brand-mark">e</span>faktura<span className="brand-dot">.</span>ba</a><span>Fakture i ponude na jednom mjestu.</span><span>© {new Date().getFullYear()} eFaktura</span></footer>
  </main>;
}
