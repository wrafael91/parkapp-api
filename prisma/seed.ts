import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { VehicleType } from "../src/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Settings (singleton)
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { total_spaces: 30 },
  });
  console.log(`Settings: total_spaces = ${settings.total_spaces}`);

  // 2. Tarifas: una por tipo de vehículo
  const tariffs = [
    { vehicle_type: VehicleType.carro, rate_per_block: 2000, block_minutes: 15 },
    { vehicle_type: VehicleType.moto, rate_per_block: 1000, block_minutes: 15 },
    { vehicle_type: VehicleType.bicicleta, rate_per_block: 500, block_minutes: 15 },
  ];

  for (const t of tariffs) {
    await prisma.tariff.upsert({
      where: { vehicle_type: t.vehicle_type },
      update: {},
      create: t,
    });
  }
  console.log(`Tarifas: ${tariffs.length} registros`);

  // 3. Espacios de parqueo según total_spaces
  for (let i = 1; i <= settings.total_spaces; i++) {
    await prisma.parkingSpace.upsert({
      where: { number: i },
      update: {},
      create: { number: i },
    });
  }
  console.log(`Espacios: ${settings.total_spaces} registros`);

  // 4. Usuario admin
  const hash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password_hash: hash,
      role: "admin",
    },
  });
  console.log("Usuario admin creado (user: admin / pass: admin123)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
