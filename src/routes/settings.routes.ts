import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authGuard, adminGuard } from "../middlewares/auth";

const router = Router();

// GET /settings
router.get("/", authGuard, async (_req: Request, res: Response) => {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  res.json({ settings });
});

// PATCH /settings (solo admin)
router.patch("/", authGuard, adminGuard, async (req: Request, res: Response) => {
  const { total_spaces } = req.body;

  if (total_spaces === undefined) {
    res.status(400).json({ error: "total_spaces es requerido" });
    return;
  }

  if (!Number.isInteger(total_spaces) || total_spaces < 1) {
    res.status(400).json({ error: "total_spaces debe ser un entero positivo" });
    return;
  }

  const currentSettings = await prisma.settings.findUnique({ where: { id: 1 } });
  const currentTotal = currentSettings?.total_spaces ?? 30;

  if (total_spaces > currentTotal) {
    const newSpaces = [];
    for (let i = currentTotal + 1; i <= total_spaces; i++) {
      newSpaces.push({ number: i });
    }
    await prisma.parkingSpace.createMany({ data: newSpaces });
  }

  if (total_spaces < currentTotal) {
    const occupiedAbove = await prisma.parkingSpace.count({
      where: {
        number: { gt: total_spaces },
        status: "ocupado",
      },
    });

    if (occupiedAbove > 0) {
      res.status(409).json({
        error: `No se puede reducir: hay ${occupiedAbove} espacio(s) ocupado(s) por encima del nuevo límite`,
      });
      return;
    }

    await prisma.parkingSpace.deleteMany({
      where: { number: { gt: total_spaces } },
    });
  }

  const settings = await prisma.settings.update({
    where: { id: 1 },
    data: { total_spaces },
  });

  res.json({ settings });
});

export default router;
