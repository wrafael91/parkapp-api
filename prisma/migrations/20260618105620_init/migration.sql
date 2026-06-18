-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'operador');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('carro', 'moto', 'bicicleta');

-- CreateEnum
CREATE TYPE "SpaceStatus" AS ENUM ('libre', 'ocupado');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'operador',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "plate" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "code" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_spaces" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "SpaceStatus" NOT NULL DEFAULT 'libre',
    "current_vehicle_id" INTEGER,

    CONSTRAINT "parking_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_history" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "space_id" INTEGER NOT NULL,
    "entry_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exit_time" TIMESTAMP(3),
    "amount_charged" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parking_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_passes" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "monthly_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariffs" (
    "id" SERIAL NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "rate_per_block" DECIMAL(10,2) NOT NULL,
    "block_minutes" INTEGER NOT NULL DEFAULT 15,

    CONSTRAINT "tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "parking_spaces_number_key" ON "parking_spaces"("number");

-- CreateIndex
CREATE UNIQUE INDEX "tariffs_vehicle_type_key" ON "tariffs"("vehicle_type");

-- AddForeignKey
ALTER TABLE "parking_spaces" ADD CONSTRAINT "parking_spaces_current_vehicle_id_fkey" FOREIGN KEY ("current_vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_history" ADD CONSTRAINT "parking_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_history" ADD CONSTRAINT "parking_history_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "parking_spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_passes" ADD CONSTRAINT "monthly_passes_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
