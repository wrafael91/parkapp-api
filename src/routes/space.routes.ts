import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authGuard, adminGuard } from "../middlewares/auth";

const router = Router();

const VALID_STATUSES = ["libre", "ocupado"];

// GET /spaces
router.get("/", authGuard, async (_req: Request, res: Response) => {
  const spaces = await prisma.parkingSpace.findMany({
    orderBy: { number: "asc" },
    include: { current_vehicle: true },
  });

  res.json({ spaces });
});

// PATCH /spaces/:id (solo admin — corrección manual)
router.patch("/:id", authGuard, adminGuard, async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID debe ser un número" });
    return;
  }

  const { status, current_vehicle_id } = req.body;

  if (!status && current_vehicle_id === undefined) {
    res.status(400).json({ error: "Envía al menos status o current_vehicle_id" });
    return;
  }

  if (status && !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: "status debe ser 'libre' o 'ocupado'" });
    return;
  }

  const space = await prisma.parkingSpace.findUnique({ where: { id } });

  if (!space) {
    res.status(404).json({ error: "Espacio no encontrado" });
    return;
  }

  if (current_vehicle_id !== undefined && current_vehicle_id !== null) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: current_vehicle_id } });
    if (!vehicle) {
      res.status(404).json({ error: "Vehículo no encontrado" });
      return;
    }
  }

  const data: Record<string, unknown> = {};

  if (status) data.status = status;
  if (current_vehicle_id !== undefined) data.current_vehicle_id = current_vehicle_id;

  if (status === "libre") {
    data.current_vehicle_id = null;
  }

  const updated = await prisma.parkingSpace.update({
    where: { id },
    data,
    include: { current_vehicle: true },
  });

  res.json({ space: updated });
});

export default router;
