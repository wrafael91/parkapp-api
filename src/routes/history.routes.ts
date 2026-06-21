import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authGuard } from "../middlewares/auth";

const router = Router();

const VALID_TYPES = ["carro", "moto", "bicicleta"];

// GET /history
router.get("/", authGuard, async (req: Request, res: Response) => {
  const { from, to, vehicle_type, plate } = req.query;

  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const dateFrom = from ? new Date(from as string) : defaultFrom;
  const dateTo = to ? new Date(to as string) : now;

  if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
    res.status(400).json({ error: "from y to deben ser fechas válidas (YYYY-MM-DD)" });
    return;
  }

  if (vehicle_type && !VALID_TYPES.includes(vehicle_type as string)) {
    res.status(400).json({ error: "vehicle_type debe ser 'carro', 'moto' o 'bicicleta'" });
    return;
  }

  const where: Record<string, unknown> = {
    entry_time: {
      gte: dateFrom,
      lte: dateTo,
    },
  };

  if (vehicle_type || plate) {
    const vehicleFilter: Record<string, unknown> = {};
    if (vehicle_type) vehicleFilter.type = vehicle_type;
    if (plate) vehicleFilter.plate = (plate as string).toUpperCase();
    where.vehicle = vehicleFilter;
  }

  const history = await prisma.parkingHistory.findMany({
    where,
    orderBy: { entry_time: "desc" },
    include: {
      vehicle: true,
      space: true,
    },
  });

  res.json({
    history,
    filters: {
      from: dateFrom.toISOString(),
      to: dateTo.toISOString(),
      vehicle_type: vehicle_type || null,
      plate: plate || null,
    },
    count: history.length,
  });
});

export default router;
