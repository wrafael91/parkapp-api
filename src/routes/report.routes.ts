import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authGuard } from "../middlewares/auth";

const router = Router();

// GET /reports/shift
router.get("/shift", authGuard, async (req: Request, res: Response) => {
  const { from, to } = req.query;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const dateFrom = from ? new Date(from as string) : todayStart;
  const dateTo = to ? new Date(to as string) : now;

  if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
    res.status(400).json({ error: "from y to deben ser fechas válidas" });
    return;
  }

  const entries = await prisma.parkingHistory.findMany({
    where: { entry_time: { gte: dateFrom, lte: dateTo } },
    include: { vehicle: true },
  });

  const exits = await prisma.parkingHistory.findMany({
    where: { exit_time: { gte: dateFrom, lte: dateTo } },
    include: { vehicle: true },
  });

  const currentlyParked = await prisma.parkingHistory.count({
    where: { exit_time: null },
  });

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const totalSpaces = settings?.total_spaces ?? 30;

  const totalRevenue = exits.reduce((sum, record) => {
    return sum + Number(record.amount_charged ?? 0);
  }, 0);

  const byType: Record<string, { entries: number; exits: number; revenue: number }> = {};

  for (const record of entries) {
    const type = record.vehicle.type;
    if (!byType[type]) byType[type] = { entries: 0, exits: 0, revenue: 0 };
    byType[type].entries++;
  }

  for (const record of exits) {
    const type = record.vehicle.type;
    if (!byType[type]) byType[type] = { entries: 0, exits: 0, revenue: 0 };
    byType[type].exits++;
    byType[type].revenue += Number(record.amount_charged ?? 0);
  }

  res.json({
    report: {
      period: {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      },
      total_entries: entries.length,
      total_exits: exits.length,
      total_revenue: totalRevenue,
      currently_parked: currentlyParked,
      occupancy: {
        occupied: currentlyParked,
        total: totalSpaces,
        percentage: Math.round((currentlyParked / totalSpaces) * 100),
      },
      by_type: byType,
    },
  });
});

export default router;
