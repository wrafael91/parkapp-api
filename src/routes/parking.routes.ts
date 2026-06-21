import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authGuard } from "../middlewares/auth";

const router = Router();

// POST /parking/entry
router.post("/entry", authGuard, async (req: Request, res: Response) => {
  const { vehicle_id, space_id } = req.body;

  if (!vehicle_id) {
    res.status(400).json({ error: "vehicle_id es requerido" });
    return;
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });

  if (!vehicle) {
    res.status(404).json({ error: "Vehículo no encontrado" });
    return;
  }

  const alreadyParked = await prisma.parkingHistory.findFirst({
    where: { vehicle_id, exit_time: null },
  });

  if (alreadyParked) {
    res.status(409).json({ error: "El vehículo ya está parqueado" });
    return;
  }

  let space;

  if (space_id) {
    space = await prisma.parkingSpace.findUnique({ where: { id: space_id } });

    if (!space) {
      res.status(404).json({ error: "Espacio no encontrado" });
      return;
    }

    if (space.status === "ocupado") {
      res.status(409).json({ error: "El espacio ya está ocupado" });
      return;
    }
  } else {
    space = await prisma.parkingSpace.findFirst({
      where: { status: "libre" },
      orderBy: { number: "asc" },
    });

    if (!space) {
      res.status(409).json({ error: "No hay espacios disponibles" });
      return;
    }
  }

  const [history, _updatedSpace] = await prisma.$transaction([
    prisma.parkingHistory.create({
      data: { vehicle_id, space_id: space.id },
      include: { vehicle: true, space: true },
    }),
    prisma.parkingSpace.update({
      where: { id: space.id },
      data: { status: "ocupado", current_vehicle_id: vehicle_id },
    }),
  ]);

  res.status(201).json({ entry: history });
});

// POST /parking/exit
router.post("/exit", authGuard, async (req: Request, res: Response) => {
  const { vehicle_id } = req.body;

  if (!vehicle_id) {
    res.status(400).json({ error: "vehicle_id es requerido" });
    return;
  }

  const activeRecord = await prisma.parkingHistory.findFirst({
    where: { vehicle_id, exit_time: null },
    include: { vehicle: true, space: true },
  });

  if (!activeRecord) {
    res.status(404).json({ error: "El vehículo no está parqueado" });
    return;
  }

  const now = new Date();
  let amountCharged = 0;

  const activePass = await prisma.monthlyPass.findFirst({
    where: {
      vehicle_id,
      active: true,
      start_date: { lte: now },
      end_date: { gte: now },
    },
  });

  if (!activePass) {
    const tariff = await prisma.tariff.findUnique({
      where: { vehicle_type: activeRecord.vehicle.type },
    });

    if (!tariff) {
      res.status(500).json({ error: "No se encontró tarifa para este tipo de vehículo" });
      return;
    }

    const entryTime = activeRecord.entry_time.getTime();
    const exitTime = now.getTime();
    const minutesParked = (exitTime - entryTime) / (1000 * 60);
    const blocks = Math.ceil(minutesParked / tariff.block_minutes);
    amountCharged = blocks * Number(tariff.rate_per_block);
  }

  const [history, _updatedSpace] = await prisma.$transaction([
    prisma.parkingHistory.update({
      where: { id: activeRecord.id },
      data: { exit_time: now, amount_charged: amountCharged },
      include: { vehicle: true, space: true },
    }),
    prisma.parkingSpace.update({
      where: { id: activeRecord.space_id },
      data: { status: "libre", current_vehicle_id: null },
    }),
  ]);

  res.json({
    exit: history,
    monthly_pass: activePass ? true : false,
    message: activePass
      ? "Vehículo con mensualidad activa — sin cobro"
      : `Cobro: $${amountCharged} (${Math.ceil((now.getTime() - activeRecord.entry_time.getTime()) / (1000 * 60))} minutos)`,
  });
});

export default router;
