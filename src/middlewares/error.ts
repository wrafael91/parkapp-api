import { Request, Response, NextFunction } from "express";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error("Error no controlado:", err);

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "JSON inválido en el body" });
    return;
  }

  res.status(500).json({ error: "Error interno del servidor" });
}
