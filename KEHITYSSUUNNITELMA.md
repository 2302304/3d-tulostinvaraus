# 3D-tulostinvaraus - Kehityssuunnitelma

## Projektin nykytila

**Valmis (Commit 1: Projektin alustus)**
- Full-stack perusrakenne (React + Express + PostgreSQL)
- JWT-autentikointi ja roolipohjainen pääsynhallinta
- CRUD-operaatiot: käyttäjät, tulostimet, varaukset
- Monikielisyys (FI/EN/SE)
- Tietoturvatoimenpiteet (Helmet, rate limiting, bcrypt, Zod)

---

## Vaihe 1: Kehitysympäristön varmistus

### 1.1 Ympäristön käynnistys ja validointi
- [ ] Docker Desktop + PostgreSQL käynnistys
- [ ] Backend-riippuvuudet ja migraatiot
- [ ] Frontend-riippuvuudet
- [ ] Testaa kirjautuminen testkäyttäjillä
- [ ] Varmista kaikkien sivujen toiminta

**Commit:** `feat: kehitysympäristön validointi ja dokumentointi`

---

## Vaihe 2: Backend-parannukset

### 2.1 AuditLog-toiminnallisuus
- [ ] Implementoi audit logging serviceen
- [ ] Kirjaa: kirjautumiset, varausten muutokset, admin-toiminnot
- [ ] Lisää admin-endpoint audit-lokien tarkasteluun

### 2.2 Validoinnin parantaminen
- [ ] Tarkista varausaikojen loogisuus (ei menneisyyteen)
- [ ] Vahvista päällekkäisyystarkistukset
- [ ] Lisää SystemSettings-rajoitusten käyttö varauksiin

### 2.3 Virheenkäsittelyn yhtenäistäminen
- [ ] Keskitetty virheenkäsittelijä (error handler middleware)
- [ ] Selkeät virhekoodit ja -viestit
- [ ] Lokitus (console → tuotannossa tiedostoon)

**Commit:** `feat(backend): audit logging ja parannettu validointi`

---

## Vaihe 3: Frontend-parannukset

### 3.1 Käyttöliittymän viimeistely
- [ ] Lomakkeiden validointiviestit käyttäjälle
- [ ] Loading-tilat ja skeletonit
- [ ] Virheilmoitusten parempi näyttö (toast-ilmoitukset)
- [ ] Vahvistusdialokit (poisto, peruutus)

### 3.2 Kalenterinäkymän parantaminen
- [ ] Viikkonäkymä päivänäkymän rinnalle
- [ ] Varauksen luonti suoraan kalenterista klikkaamalla
- [ ] Varauksen tietojen näyttö hover/click

### 3.3 Admin-paneelin laajennukset
- [ ] Varausten hallinta (kaikki varaukset, suodatus)
- [ ] Audit-lokien näyttö
- [ ] Järjestelmäasetusten muokkaus

**Commit:** `feat(frontend): käyttöliittymän viimeistely ja admin-laajennukset`

---

## Vaihe 4: Testaus

### 4.1 Backend-testit (Jest + Supertest)
- [ ] Testikonfiguraatio ja testiympäristö
- [ ] Auth-testit (rekisteröinti, kirjautuminen, token refresh)
- [ ] Printer CRUD -testit
- [ ] Reservation-testit (luonti, päällekkäisyys, peruutus)
- [ ] Middleware-testit (auth, rooli)

### 4.2 Frontend-testit (Vitest + Testing Library)
- [ ] Testikonfiguraatio
- [ ] Komponenttitestit (LoginPage, ReservationsPage)
- [ ] Hook-testit (useAuth)
- [ ] API-mock testit

### 4.3 E2E-testit (Playwright) - valinnainen
- [ ] Kirjautumispolku
- [ ] Varauksen luonti -polku
- [ ] Admin-toiminnot

**Commit:** `test: backend- ja frontend-testit`

---

## Vaihe 5: Tuotantovalmistelu

### 5.1 Ympäristökonfiguraatio
- [ ] Tuotanto .env -mallipohja
- [ ] Environment-validointi käynnistyksessä
- [ ] Erilliset konfiguraatiot (dev/prod)

### 5.2 Docker-tuotantokonfiguraatio
- [ ] Multi-stage Dockerfile (backend)
- [ ] Multi-stage Dockerfile (frontend → nginx)
- [ ] docker-compose.prod.yml
- [ ] Health check -endpointit

### 5.3 Tietoturvan vahvistus
- [ ] HTTPS-konfiguraatio
- [ ] CORS tuotantodomainille
- [ ] Secrets management (.env, ei hardcoded)
- [ ] Rate limiting tuotantoarvoilla

**Commit:** `feat: tuotanto-Docker-konfiguraatio`

---

## Vaihe 6: CI/CD ja julkaisu

### 6.1 GitHub Actions
- [ ] Lint ja tyypintarkistus (push/PR)
- [ ] Testien ajo automaattisesti
- [ ] Build-validointi
- [ ] (Valinnainen) Automaattinen deploy

### 6.2 Hosting-valinta ja deployment
**Vaihtoehdot:**
1. **Render.com** - Ilmainen tier, helppo setup
2. **Railway.app** - PostgreSQL + backend + frontend
3. **Fly.io** - Docker-pohjainen, hyvä kontrolli
4. **DigitalOcean App Platform** - Edullinen, luotettava

- [ ] Valitse hosting-palvelu
- [ ] Konfiguroi tietokanta (tuotanto-PostgreSQL)
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Testaa tuotannossa

**Commit:** `ci: GitHub Actions workflow`
**Commit:** `deploy: tuotantojulkaisu [hosting-palvelu]`

---

## Vaihe 7: Dokumentointi (opinnäytetyö)

### 7.1 Tekninen dokumentaatio
- [ ] API-dokumentaatio (endpointit, parametrit, vastaukset)
- [ ] Tietokantadokumentaatio (ER-kaavio, taulukuvaukset)
- [ ] Arkkitehtuurikuvaus (kaaviot)
- [ ] Asennusohje (kehitys + tuotanto)

### 7.2 Opinnäytetyön kirjoitus
- [ ] Johdanto ja tausta
- [ ] Teoriaosuus (teknologiat, käsitteet)
- [ ] Toteutus (vaiheet, ratkaisut, haasteet)
- [ ] Testaus ja tulokset
- [ ] Pohdinta ja johtopäätökset
- [ ] Lähteet

---

## Versiohallinta - Git-käytännöt

### Commit-viestien muoto
```
<tyyppi>(<laajuus>): <lyhyt kuvaus>

[Valinnainen pidempi kuvaus]
```

**Tyypit:**
- `feat` - Uusi ominaisuus
- `fix` - Bugikorjaus
- `test` - Testit
- `docs` - Dokumentaatio
- `refactor` - Refaktorointi
- `ci` - CI/CD-muutokset
- `deploy` - Julkaisuun liittyvä

### Branchit (tarvittaessa)
- `main` - Tuotantokelpoinen koodi
- `develop` - Kehityshaara (valinnainen)
- `feature/*` - Ominaisuushaarat (valinnainen)

### Commitit (suomeksi)
1. ✅ `Projektin alustus: Full-stack varausjärjestelmän perusrakenne`
2. ✅ `feat: kehitysympäristön konfigurointi ja dokumentointi`
3. `feat(backend): audit-lokitus ja parannettu validointi`
4. `feat(frontend): käyttöliittymän viimeistely ja parannukset`
5. `test: backend-yksikkö- ja integraatiotestit`
6. `test: frontend-komponenttitestit`
7. `feat: tuotanto-Docker-konfiguraatio`
8. `ci: GitHub Actions -työnkulku`
9. `deploy: tuotantojulkaisu`
10. `docs: API- ja tekninen dokumentaatio`

---

## Teknologiapino (vahvistettu)

| Kerros | Teknologia | Versio |
|--------|------------|--------|
| Frontend | React | 18.2 |
| Frontend | TypeScript | 5.3 |
| Frontend | Vite | 5.0 |
| Frontend | Tailwind CSS | 3.4 |
| Frontend | TanStack Query | 5.17 |
| Backend | Node.js | 18+ |
| Backend | Express.js | 4.18 |
| Backend | Prisma ORM | 5.10 |
| Tietokanta | PostgreSQL | 15 |
| DevOps | Docker | Desktop |
| CI/CD | GitHub Actions | - |
| Hosting | TBD | - |

---

## Seuraava askel

**Aloitetaan Vaiheesta 1:** Käynnistetään kehitysympäristö ja varmistetaan, että kaikki toimii ennen jatkokehitystä.

```bash
# 1. Käynnistä tietokanta
docker-compose up -d

# 2. Backend
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# 3. Frontend (uusi terminaali)
cd frontend
npm install
npm run dev
```

**Testikäyttäjät:**
- Admin: `admin@vamk.fi` / `Admin123!`
- Staff: `staff@vamk.fi` / `Staff123!`
- Opiskelija: `opiskelija@edu.vamk.fi` / `Student123!`
