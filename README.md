# 3D-tulostinvaraus

Technobothnian 3D-tulostimien varausjärjestelmä - moderni web-sovellus tulostimien varausten hallintaan.

## Teknologiat

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL + Prisma ORM
- JWT-autentikointi

### Frontend
- React 18 + Vite
- TypeScript
- Tailwind CSS
- i18next (monikielisyys: FI/EN/SE)

## Kehitysympäristö

### Vaatimukset
- Node.js 18+
- Docker & Docker Compose
- Git

### Käynnistys

```bash
# Käynnistä Docker-ympäristö (PostgreSQL)
docker-compose up -d

# Backend
cd backend
npm install
npm run dev

# Frontend (uusi terminaali)
cd frontend
npm install
npm run dev
```

### Portit
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

## Projektin rakenne

```
3d-tulostinvaraus/
├── backend/
│   ├── src/
│   │   ├── controllers/    # HTTP-pyyntöjen käsittely
│   │   ├── services/       # Business-logiikka
│   │   ├── middleware/     # Autentikointi, validointi
│   │   ├── routes/         # API-reitit
│   │   ├── types/          # TypeScript-tyypit
│   │   └── utils/          # Apufunktiot
│   └── prisma/             # Tietokantaskeema
├── frontend/
│   ├── src/
│   │   ├── components/     # UI-komponentit
│   │   ├── pages/          # Sivukomponentit
│   │   ├── services/       # API-kutsut
│   │   ├── hooks/          # Custom React hooks
│   │   ├── i18n/           # Käännökset
│   │   └── types/          # TypeScript-tyypit
└── docker-compose.yml
```

## Lisenssi

MIT
