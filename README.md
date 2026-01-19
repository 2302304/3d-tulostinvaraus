# 3D-tulostinvaraus

Technobothnian 3D-tulostimien varausjärjestelmä - moderni web-sovellus tulostimien varausten hallintaan.

**Opinnäytetyö** | VAMK - Vaasan ammattikorkeakoulu

## Ominaisuudet

- Käyttäjien rekisteröityminen ja kirjautuminen (JWT)
- 3D-tulostimien varaaminen kalenterinäkymästä
- Päivä- ja viikkonäkymä varauskalenterissa
- Omien varausten hallinta (teko, peruutus)
- Admin-paneeli: käyttäjien, tulostimien ja varausten hallinta
- Monikielisyys: suomi, englanti, ruotsi
- Responsiivinen käyttöliittymä

## Teknologiat

### Backend
- **Node.js** + **Express.js**
- **TypeScript**
- **PostgreSQL** + **Prisma ORM**
- **JWT**-autentikointi (access + refresh token)
- **Zod**-validointi
- **Jest** + **Supertest** (testaus)

### Frontend
- **React 18** + **Vite**
- **TypeScript**
- **Tailwind CSS**
- **TanStack Query** (React Query)
- **react-i18next** (monikielisyys)
- **Vitest** + **Testing Library** (testaus)

### DevOps
- **Docker** + **Docker Compose**
- **nginx** (tuotantopalvelin)

## Käynnistys

### Vaatimukset
- Node.js 20+
- Docker & Docker Compose
- Git

### Vaihtoehto 1: Docker (suositeltu)

```bash
# Kloonaa repo
git clone https://github.com/2302304/3d-tulostinvaraus.git
cd 3d-tulostinvaraus

# Kopioi ympäristömuuttujat
cp .env.example .env

# Käynnistä kaikki kontit
docker-compose up -d

# Aja seed-data (testikäyttäjät ja tulostimet)
cd backend
npm install
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tulostinvaraus" npx tsx prisma/seed.ts
```

Sovellus käynnistyy: **http://localhost**

### Vaihtoehto 2: Kehitysympäristö

```bash
# Käynnistä tietokanta
docker-compose up -d db

# Backend
cd backend
npm install
npm run db:push
npm run db:seed
npm run dev

# Frontend (uusi terminaali)
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Testikäyttäjät

| Rooli | Sähköposti | Salasana |
|-------|------------|----------|
| Admin | admin@vamk.fi | Admin123! |
| Henkilökunta | staff@vamk.fi | Staff123! |
| Opiskelija | opiskelija@edu.vamk.fi | Student123! |

## Testien ajaminen

```bash
# Backend-testit (24 testiä)
cd backend
npm test

# Frontend-testit (19 testiä)
cd frontend
npm test
```

## API-dokumentaatio

### Autentikointi
| Metodi | Endpoint | Kuvaus |
|--------|----------|--------|
| POST | /api/auth/register | Rekisteröityminen |
| POST | /api/auth/login | Kirjautuminen |
| POST | /api/auth/refresh | Token-päivitys |

### Tulostimet
| Metodi | Endpoint | Kuvaus |
|--------|----------|--------|
| GET | /api/printers | Hae kaikki tulostimet |
| GET | /api/printers/:id | Hae yksittäinen tulostin |
| POST | /api/printers | Luo tulostin (admin) |
| PATCH | /api/printers/:id | Päivitä tulostin (admin) |
| DELETE | /api/printers/:id | Poista tulostin (admin) |

### Varaukset
| Metodi | Endpoint | Kuvaus |
|--------|----------|--------|
| GET | /api/reservations | Hae varaukset |
| GET | /api/reservations/my | Omat varaukset |
| POST | /api/reservations | Luo varaus |
| POST | /api/reservations/:id/cancel | Peruuta varaus |

### Käyttäjät (admin)
| Metodi | Endpoint | Kuvaus |
|--------|----------|--------|
| GET | /api/users | Hae käyttäjät |
| PATCH | /api/users/:id/role | Muuta rooli |

## Projektin rakenne

```
3d-tulostinvaraus/
├── backend/
│   ├── src/
│   │   ├── routes/         # API-reitit
│   │   ├── services/       # Business-logiikka
│   │   ├── middleware/     # Auth, virheenkäsittely
│   │   ├── utils/          # Validointi, apufunktiot
│   │   └── __tests__/      # Backend-testit
│   └── prisma/
│       ├── schema.prisma   # Tietokantaskeema
│       └── seed.ts         # Testidata
├── frontend/
│   ├── src/
│   │   ├── components/     # UI-komponentit
│   │   ├── pages/          # Sivut
│   │   ├── services/       # API-kutsut
│   │   ├── stores/         # Zustand-tilanhallinta
│   │   ├── i18n/           # Käännökset (fi/en/sv)
│   │   └── __tests__/      # Frontend-testit
│   └── nginx.conf          # Tuotanto-nginx
├── docker-compose.yml      # Docker-orkestraatio
├── .env.example            # Ympäristömuuttujamalli
└── README.md
```

## Ympäristömuuttujat

```env
# Tietokanta
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=tulostinvaraus

# JWT (generoi tuotantoon: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
```

## Lisenssi

MIT

## Tekijä

Opinnäytetyö - VAMK 2026
