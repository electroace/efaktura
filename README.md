# eFaktura

Aplikacija za izradu faktura, ponuda i dokumenta s proizvoljnim nazivom. Korisnik vidi samo svoje dokumente. Besplatni paket omogućava 3 nova dokumenta mjesečno i do 5 stavki po dokumentu. Administrator može dodijeliti plaćeni paket i postaviti cijenu; početna cijena je 22 KM mjesečno **s uključenim PDV-om**.

## Šta je potrebno za javno puštanje

GitHub čuva izvorni kod. Aplikaciju pokreće Cloudflare Worker, podaci su u Cloudflare D1, a logotipi u R2. Supabase Auth pruža prijavu putem emaila i lozinke te Google i Apple naloga. Za slanje verifikacionih emailova postavite vlastiti SMTP (preporuka: Resend). Nema integrisane automatske naplate; administrator ručno uključuje plaćeni paket nakon dogovora s korisnikom.

1. Kreirajte Cloudflare račun, D1 bazu `efaktura-db` i R2 bucket `efaktura-logos`. Sačuvajte D1 database ID.
2. Kreirajte Supabase projekat. U Auth uključite email potvrdu i Google. Apple uključite nakon podešavanja Apple Developer računa. Postavite Site URL na stvarnu adresu aplikacije i dodajte `https://VAŠA-ADRESA/auth/callback` na dozvoljene redirect URL-ove. Kopirajte project URL i publishable key. Supabase service role ključ se nikada ne unosi u browser ili GitHub.
3. Podesite Supabase custom SMTP, npr. preko Resenda i verifikovanog domena, prije javne registracije. Na besplatnom Supabase ugrađenom SMTP-u nije predviđeno redovno slanje verifikacionih emailova.
4. U Cloudflare Workers Git integraciji povežite ovaj repozitorij. Za build su potrebne varijable `D1_DATABASE_ID`, `D1_DATABASE_NAME` (npr. `efaktura-db`) i `R2_BUCKET_NAME` (npr. `efaktura-logos`). Build naredba: `pnpm install --frozen-lockfile && pnpm build`. Deploy naredba: `pnpm exec wrangler deploy --config dist/server/wrangler.json`. Provjerite da generisana Worker konfiguracija pokazuje na vašu D1 bazu i R2 bucket.
5. Runtime varijable u Cloudflare Workeru: `SUPABASE_URL` i `SUPABASE_PUBLISHABLE_KEY`. Dok nisu postavljene, javna prijava nije spremna. `electroace@gmail.com` je jedini administratorski email u trenutnoj verziji; registrujte taj potvrđeni email u Supabase Auth.
6. Kreirajte tabele u D1 primjenom migracija redom: `drizzle/0000_funny_tarot.sql` pa `drizzle/0001_mute_killer_shrike.sql`. Migraciju `0001` izvršite samo ako ste već izvršili `0000`. Za postojeću bazu s ranijim `0000` primijenite samo `0001`. Sačuvajte sigurnosnu kopiju baze prije migracije.
7. Testirajte registraciju, email potvrdu, Google/Apple prijavu, izolaciju dokumenata s dva odvojena naloga, ograničenja besplatnog paketa i izvoz. Tek tada povežite kupljenu domenu.

Lokalno: Node.js >=22.13, `pnpm install`, zatim `pnpm dev`. Lokalna D1 baza se priprema nakon builda pomoću Wranglerove `d1 execute --local` naredbe za svaku migraciju. Datoteka `.env.example` navodi potrebne varijable; stvarne vrijednosti držite izvan repozitorija.

## Sigurnost i granice

API provjerava prijavljenog korisnika na serveru, a upiti za dokumente filtriraju po njegovom identifikatoru. Admin pristup zahtijeva potvrđeni email `electroace@gmail.com`. PDF se dobija putem pregleda za štampu u browseru; Word kao `.docx`. Ovo nisu fiskalne/eRačun integracije niti automatsko izdavanje računa za pretplatu. Prije komercijalnog korištenja provjerite obavezne elemente računa, politiku privatnosti, uslove korištenja i rezervne kopije s lokalnim stručnjacima.
