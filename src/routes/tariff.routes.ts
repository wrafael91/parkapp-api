import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authGuard, adminGuard } from "../middlewares/auth";

const router = Router();

// GET /tariffs
router.get("/", authGuard, async (_req: Request, res: Response) => {
  const tariffs = await prisma.tariff.findMany({
    orderBy: { id: "asc" },
  });

  res.json({ tariffs });
});

// PATCH /tariffs/:id (solo admin)
router.patch("/:id", authGuard, adminGuard, async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID debe ser un número" });
    return;
  }

  const { rate_per_block, block_minutes } = req.body;

  if (rate_per_block === undefined && block_minutes === undefined) {
    res.status(400).json({ error: "Envía al menos rate_per_block o block_minutes" });
    return;
  }

  if (rate_per_block !== undefined && (typeof rate_per_block !== "number" || rate_per_block <= 0)) {
    res.status(400).json({ error: "rate_per_block debe ser un número positivo" });
    return;
  }

  if (block_minutes !== undefined && (!Number.isInteger(block_minutes) || block_minutes <= 0)) {
    res.status(400).json({ error: "block_minutes debe ser un entero positivo" });
    return;
  }

  const tariff = await prisma.tariff.findUnique({ where: { id } });

  if (!tariff) {
    res.status(404).json({ error: "Tarifa no encontrada" });
    return;
  }

  const data: Record<string, unknown> = {};
  if (rate_per_block !== undefined) data.rate_per_block = rate_per_block;
  if (block_minutes !== undefined) data.block_minutes = block_minutes;

  const updated = await prisma.tariff.update({
    where: { id },
    data,
  });

  res.json({ tariff: updated });
});

export default router;
