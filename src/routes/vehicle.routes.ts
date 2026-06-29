import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authGuard, adminGuard } from "../middlewares/auth";

const router = Router();

const VALID_TYPES = ["carro", "moto", "bicicleta"];

// POST /vehicles
router.post("/", authGuard, async (req: Request, res: Response) => {
  const { plate, type } = req.body;

  if (!plate || !type) {
    res.status(400).json({ error: "plate y type son requeridos" });
    return;
  }

  if (!VALID_TYPES.includes(type)) {
    res.status(400).json({ error: "type debe ser 'carro', 'moto' o 'bicicleta'" });
    return;
  }

  const exists = await prisma.vehicle.findUnique({ where: { plate } });

  if (exists) {
    res.status(409).json({ error: "La placa ya está registrada" });
    return;
  }

  const vehicle = await prisma.vehicle.create({
    data: { plate: plate.toUpperCase(), type },
  });

  res.status(201).json({ vehicle });
});

// GET /vehicles
router.get("/", authGuard, async (_req: Request, res: Response) => {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { created_at: "desc" },
  });

  res.json({ vehicles });
});

// GET /vehicles/:id
router.get("/:id", authGuard, async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID debe ser un número" });
    return;
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id } });

  if (!vehicle) {
    res.status(404).json({ error: "Vehículo no encontrado" });
    return;
  }

  res.json({ vehicle });
});

// PATCH /vehicles/:id (solo admin)
router.patch("/:id", authGuard, adminGuard, async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID debe ser un número" });
    return;
  }

  const { plate } = req.body;

  if (!plate || typeof plate !== "string" || !plate.trim()) {
    res.status(400).json({ error: "plate es requerido" });
    return;
  }

  const normalized = plate.trim().toUpperCase();

  const duplicate = await prisma.vehicle.findFirst({
    where: { plate: normalized, NOT: { id } },
  });

  if (duplicate) {
    res.status(409).json({ error: "La placa ya está registrada en otro vehículo" });
    return;
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: { plate: normalized },
  });

  res.json({ vehicle });
});

export default router;
