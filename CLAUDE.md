# ParkApp API — Contexto del proyecto

Backend fullstack de un sistema de gestión de parqueadero. Proyecto de portafolio
propio (NO es la entrega de la universidad — ese front en Ionic queda aparte).
Objetivo: portafolio defendible para vacantes fullstack junior (Colombia + remoto USD).

## Stack
- Backend: Node + Express + TypeScript
- DB: PostgreSQL
- ORM: Prisma
- Auth: bcrypt (hashing) + JWT (sesiones sin estado)
- Deploy: API en Render · DB en Neon · (el front Angular/Ionic se conecta después)

## Decisiones (esto se defiende en el walkthrough)
- Node/Express+TS: mismo lenguaje que el front, stack con más vacantes junior remotas.
- Postgres, no Mongo: datos relacionales (vehículos ↔ espacios ↔ historial ↔ mensualidades),
  necesito integridad referencial y joins. SQL es más marketable.
- Prisma: tipado fuerte (encaja con TS estricto), migraciones versionadas.
- bcrypt + JWT en el SERVIDOR, no Web Crypto en el cliente: el cliente es manipulable,
  el hashing client-side no protege nada. La auth vive en el servidor.
- Facturación en el backend: la lógica de cobro (bloques de 15 min) no puede vivir
  en el cliente donde el usuario podría alterarla.

## Modelo de datos
- users: id, username (unique), password_hash, role (admin | operador), created_at
- vehicles: id, plate (unique), type (carro | moto | bicicleta), code (auto-secuencial), created_at
- parking_spaces: id, number (1–30), status (libre | ocupado), current_vehicle_id (FK, nullable)
- parking_history: id, vehicle_id (FK), space_id (FK), entry_time, exit_time (nullable),
  amount_charged (nullable), created_at
- monthly_passes: id, vehicle_id (FK), start_date, end_date, active, amount
- tariffs: id, vehicle_type, rate_per_block, block_minutes (default 15)

Reglas:
- Placa duplicada: unique en plate.
- Exención de cobro: si el vehículo tiene mensualidad activa al salir → no se cobra.
- Roles: admin (gestión completa) vs operador (operación diaria).
- Fuente de verdad de "vehículo parqueado": parking_history con exit_time = null.
  parking_spaces.current_vehicle_id es solo un atajo de lectura; mantenerlos consistentes.

## Endpoints REST
- Auth: POST /auth/register (solo admin), POST /auth/login → JWT
- Vehicles: GET /vehicles, POST /vehicles, GET /vehicles/:id
- Spaces: GET /spaces, PATCH /spaces/:id
- Parking: POST /parking/entry (asigna espacio), POST /parking/exit (cobra por bloques de 15 min, aplica exención)
- History: GET /history (filtros fecha/tipo, ventana 30 días)
- Passes: GET /passes, POST /passes
- Tariffs: GET /tariffs, PATCH /tariffs (solo admin)
- Reports: GET /reports/shift
- Middleware: authGuard (verifica JWT), adminGuard (verifica role).

## Cómo trabajamos (regla)
- Explícame el PORQUÉ de cada paso, no solo escupas código.
- Yo escribo la lógica de negocio; tú haces el scaffold y me corriges.
- Antes de cambiar de fase, valida que yo pueda explicar lo construido sin mirar.

## Fase actual
FASE 1 — Esquema + setup. Pendiente: init Node+TS+Express, configurar Prisma + Postgres,
definir schema.prisma con las tablas de arriba, primera migración, seed (6 tarifas,
30 espacios, 1 usuario admin).