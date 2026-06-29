import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authGuard, adminGuard } from "../middlewares/auth";

const router = Router();

// GET /passes
router.get("/", authGuard, async (_req: Request, res: Response) => {
  const passes = await prisma.monthlyPass.findMany({
    orderBy: { start_date: "desc" },
    include: { vehicle: true },
  });

  res.json({ passes });
});

// POST /passes (solo admin)
router.post("/", authGuard, adminGuard, async (req: Request, res: Response) => {
  const { vehicle_id, start_date, end_date, amount } = req.body;

  if (!vehicle_id || !start_date || !end_date || amount === undefined) {
    res.status(400).json({ error: "vehicle_id, start_date, end_date y amount son requeridos" });
    return;
  }

  if (typeof amount !== "number" || amount <= 0) {
    res.status(400).json({ error: "amount debe ser un número positivo" });
    return;
  }

  const start = new Date(start_date);
  const end = new Date(end_date);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({ error: "start_date y end_date deben ser fechas válidas (YYYY-MM-DD)" });
    return;
  }

  if (end <= start) {
    res.status(400).json({ error: "end_date debe ser posterior a start_date" });
    return;
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });

  if (!vehicle) {
    res.status(404).json({ error: "Vehículo no encontrado" });
    return;
  }

  const pass = await prisma.monthlyPass.create({
    data: {
      vehicle_id,
      start_date: start,
      end_date: end,
      amount,
    },
    include: { vehicle: true },
  });

  res.status(201).json({ pass });
});

// DELETE /passes/:id (solo admin)
router.delete("/:id", authGuard, adminGuard, async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID debe ser un número" });
    return;
  }

  const pass = await prisma.monthlyPass.findUnique({ where: { id } });

  if (!pass) {
    res.status(404).json({ error: "Mensualidad no encontrada" });
    return;
  }

  await prisma.monthlyPass.delete({ where: { id } });

  res.json({ message: "Mensualidad eliminada" });
});

export default router;
