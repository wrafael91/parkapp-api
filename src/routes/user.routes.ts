import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authGuard, adminGuard } from "../middlewares/auth";

const router = Router();

// GET /users (solo admin)
router.get("/", authGuard, adminGuard, async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, created_at: true },
    orderBy: { created_at: "asc" },
  });

  res.json({ users });
});

// DELETE /users/:id (solo admin, no puede eliminarse a sí mismo)
router.delete("/:id", authGuard, adminGuard, async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID debe ser un número" });
    return;
  }

  const requestingUserId = (req as any).user.userId;

  if (id === requestingUserId) {
    res.status(400).json({ error: "No puedes eliminar tu propio usuario" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  await prisma.user.delete({ where: { id } });

  res.json({ message: "Usuario eliminado" });
});

export default router;
