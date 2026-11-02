# PetPal

PetPal is a mobile app for pet owners. It helps them find pet shops, dog parks and vets on a map. They can book dog walkers, keep care reminders, post lost and found pets, and check whether a food is safe for their pet.

The app is available in English and Macedonian, and the seed data is centred on Skopje.

## Features

- **Pet profiles**: add and manage dogs, cats, parrots and hamsters.
- **Places and map**: shops, dog parks, vets and emergency vets, with working hours, location-based discovery and map pins. Shop owners can submit places, and an approval status controls which ones are shown.
- **Reviews and favourites**: rate places and walkers, and save the places you like.
- **Dog walkers**: browse walker profiles, send walk requests, and accept or decline incoming ones.
- **Reminders**: one-off or repeating (daily, weekly, monthly, yearly) pet-care reminders.
- **Lost & Found**: post lost or found pets and mark posts as resolved.
- **Food check**: ask "can my pet eat X?" and get a Safe / Caution / Toxic verdict. The answer comes from a curated database first and falls back to Claude (Anthropic API). Requests are rate-limited to 10 per minute per user.
- **Accounts**: two roles, pet owner and shop owner, with JWT access and refresh tokens.

## Tech stack

| Layer    | Technology |
|----------|------------|
| Mobile   | Expo / React Native, TypeScript, React Navigation, react-native-web |
| API      | ASP.NET Core (.NET 10) minimal APIs, ASP.NET Identity, JWT bearer auth |
| Data     | PostgreSQL + PostGIS, EF Core with NetTopologySuite |
| AI       | Anthropic Messages API (food check fallback) |
| API docs | OpenAPI + Scalar |

## Repository layout

```
TeamProject/          ASP.NET Core API (the backend in use)
  Domain/             Entities and enums
  Data/               AppDbContext and demo-data seeder
  Endpoints/          Minimal API endpoint groups (auth, pets, places, walkers, ...)
  Services/           TokenService, FoodCheckService
  Migrations/         EF Core migrations
petpal-app/           Expo mobile/web client
  src/screens/        App screens
  src/api.ts          API client (token refresh, error handling)
docker-compose.yml    PostGIS database for local development
parks.sql             Optional SQL that adds two extra Skopje dog parks
```

## Getting started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (LTS)
- [Docker](https://www.docker.com/)

### 1. Start the database

```bash
docker compose up -d
```

This starts PostGIS on `localhost:5432` with database, user and password `petapp` / `petapp` / `petapp_dev`.

### 2. Run the API

```bash
cd TeamProject
dotnet run
```

The API listens on `http://localhost:5080`. On startup it applies migrations, creates the roles and seeds demo data (in Development). The interactive API reference is at `http://localhost:5080/scalar`, and a health check is at `/health`.

To enable the AI food-check fallback, set your Anthropic API key:

```bash
dotnet user-secrets set "Anthropic:ApiKey" "<your-key>"
```

> The JWT signing key in `appsettings.json` is for development only. Override `Jwt:Key` with a long random secret for any real deployment.

### 3. Run the app

```bash
cd petpal-app
npm install
npx expo start
```

Press `w` to open it in the browser, or scan the QR code with Expo Go.

When you run on a physical phone, the app can't reach `localhost`. Create `petpal-app/.env` that points to your machine's IP:

```
EXPO_PUBLIC_API_URL=http://YOUR-MACHINE-IP:5080
```

CORS allows `http://localhost:8081` and `http://localhost:19006` for the web build.

### Optional: extra seed data

```bash
docker exec -i petapp-db psql -U petapp -d petapp < parks.sql
```

## API overview

| Group | Routes |
|-------|--------|
| Auth | `POST /auth/register/owner`, `/auth/register/shop`, `/auth/login`, `/auth/refresh`, `/auth/logout` |
| Profile | `GET`/`PUT /me` |
| Discovery | `GET /home/{petType}`, `GET /map/pins` |
| Pets | `GET`/`POST /pets`, `PUT`/`DELETE /pets/{id}` |
| Places | `GET /places`, `/places/{id}`, `/places/mine`, `POST`/`PUT`/`DELETE` |
| Reviews & favourites | `/reviews`, `/favorites/{placeId}` |
| Walkers | `GET /walkers`, `/walkers/{id}`, `GET`/`PUT /walkers/me`, `POST /walkers/{id}/requests` |
| Walk requests | `GET /walker-requests/incoming`, `/sent`, `POST /walker-requests/{id}/respond` |
| Reminders | CRUD on `/reminders` |
| Lost & Found | CRUD on `/lostfound`, `POST /lostfound/{id}/resolve` |
| Food check | `POST /foodcheck`, `GET /foodcheck/history` |

See `TeamProject/TeamProject.http` for sample requests.

## Figma Screens

<img width="2700" height="1788" alt="PetUnit" src="https://github.com/user-attachments/assets/5a033da8-1fe1-4f7e-ab5a-4876ab3a80d9" />

<img width="2700" height="1788" alt="PetUnit" src="https://github.com/user-attachments/assets/5a033da8-1fe1-4f7e-ab5a-4876ab3a80d9" />
