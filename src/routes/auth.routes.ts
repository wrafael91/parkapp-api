import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { authGuard, adminGuard } from "../middlewares/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

// POST /auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "username y password son requeridos" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

// POST /auth/register (solo admin)
router.post("/register", authGuard, adminGuard, async (req: Request, res: Response) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "username y password son requeridos" });
    return;
  }

  if (role && role !== "admin" && role !== "operador") {
    res.status(400).json({ error: "role debe ser 'admin' o 'operador'" });
    return;
  }

  const exists = await prisma.user.findUnique({ where: { username } });

  if (exists) {
    res.status(409).json({ error: "El username ya existe" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, password_hash, role: role || "operador" },
  });

  res.status(201).json({
    user: { id: user.id, username: user.username, role: user.role },
  });
});

export default router;
