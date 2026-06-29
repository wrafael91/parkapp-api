# ParkApp API

Backend de un sistema de gestión de parqueadero. Proyecto de portafolio fullstack orientado a vacantes junior en Colombia y remoto USD.

**Live:** `https://parkapp-api.onrender.com` · **Frontend:** `https://parkapp-web.vercel.app`

> **Demo:** usuario `admin` · contraseña `admin123`

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL (Neon) |
| Auth | bcrypt + JWT |
| Deploy | Render |

---

## Modelo de datos

```
users           → id, username (unique), password_hash, role (admin | operador)
vehicles        → id, plate (unique), type (carro | moto | bicicleta), code (auto-secuencial)
parking_spaces  → id, number (1–N), status (libre | ocupado), current_vehicle_id (FK nullable)
parking_history → id, vehicle_id, space_id, entry_time, exit_time (nullable), amount_charged (nullable)
monthly_passes  → id, vehicle_id, start_date, end_date, active, amount
tariffs         → id, vehicle_type (unique), rate_per_block, block_minutes (default 15)
settings        → id (siempre 1), total_spaces
```

**Reglas de negocio:**
- Fuente de verdad de "vehículo parqueado": `parking_history` con `exit_time = null`
- Cobro por bloques de 15 min (configurable en `tariffs`)
- Si el vehículo tiene mensualidad vigente al salir → cobro $0
- `parking_spaces.current_vehicle_id` es un atajo de lectura; se mantiene sincronizado con el historial

---

## Endpoints

### Auth
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST | `/auth/register` | Crear usuario | admin |
| POST | `/auth/login` | Login → JWT | público |

### Vehículos
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | `/vehicles` | Listar todos | auth |
| POST | `/vehicles` | Registrar vehículo | auth |
| GET | `/vehicles/:id` | Detalle | auth |
| PATCH | `/vehicles/:id` | Editar placa | admin |

### Espacios
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | `/spaces` | Estado de todos los espacios | auth |
| PATCH | `/spaces/:id` | Actualizar espacio | auth |

### Parking
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST | `/parking/entry` | Registrar entrada (asigna espacio libre) | auth |
| POST | `/parking/exit` | Registrar salida (cobra, aplica exención) | auth |

### Historial
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | `/history` | Historial con filtros (fecha, tipo, placa) | auth |

### Mensualidades
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | `/passes` | Listar mensualidades | auth |
| POST | `/passes` | Crear mensualidad | auth |
| DELETE | `/passes/:id` | Eliminar mensualidad | admin |

### Tarifas
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | `/tariffs` | Ver tarifas | auth |
| PATCH | `/tariffs/:id` | Editar tarifa | admin |

### Reportes
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | `/reports/shift` | Resumen de turno (entradas, salidas, recaudo, ocupación) | auth |

### Configuración
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | `/settings` | Ver configuración | auth |
| PATCH | `/settings` | Editar total de espacios | admin |

---

## Correr localmente

### Requisitos
- Node.js 20+
- PostgreSQL (local o Neon)

### Pasos

```bash
# 1. Clonar
git clone https://github.com/wrafael91/parkapp-api.git
cd parkapp-api

# 2. Instalar dependencias
npm install

# 3. Variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL y JWT_SECRET

# 4. Migrar base de datos
npx prisma migrate deploy

# 5. Seed (30 espacios, 3 tarifas, 1 usuario admin)
npx ts-node prisma/seed.ts

# 6. Desarrollo
npm run dev
```

### Variables de entorno

```env
DATABASE_URL="postgresql://usuario:password@host/dbname"
JWT_SECRET="tu_secreto_aqui"
```

---

## Decisiones técnicas

**Node + TypeScript sobre Java/Python:** mismo lenguaje que el frontend, mayor densidad de vacantes junior remotas, y TypeScript da tipado estricto sin sacrificar velocidad de desarrollo.

**PostgreSQL sobre MongoDB:** los datos son inherentemente relacionales (vehículos ↔ espacios ↔ historial ↔ mensualidades). Se necesita integridad referencial y joins; SQL es más defendible en entrevistas técnicas.

**Prisma como ORM:** genera tipos TypeScript a partir del schema, por lo que errores de modelo se detectan en tiempo de compilación. Las migraciones quedan versionadas en el repo.

**Auth en el servidor (bcrypt + JWT):** el cliente es manipulable; hashear contraseñas en el cliente no protege nada. El JWT vive en el servidor y se verifica en cada request mediante middleware.

**Facturación en el backend:** la lógica de cobro por bloques de 15 min no puede vivir en el cliente donde el usuario podría alterarla. El backend calcula, cobra y registra.

**Dos roles (admin / operador):** el operador maneja la operación diaria (entrada/salida); el admin gestiona configuración, tarifas, usuarios y puede corregir errores (editar placas, eliminar mensualidades).

---

## Estructura del proyecto

```
src/
├── index.ts              # Entry point, middlewares globales
├── routes/
│   ├── auth.routes.ts
│   ├── vehicle.routes.ts
│   ├── space.routes.ts
│   ├── parking.routes.ts
│   ├── history.routes.ts
│   ├── pass.routes.ts
│   ├── tariff.routes.ts
│   ├── report.routes.ts
│   └── settings.routes.ts
├── middleware/
│   ├── authGuard.ts      # Verifica JWT
│   └── adminGuard.ts     # Verifica role === admin
└── generated/
    └── prisma/           # Cliente Prisma auto-generado
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```
