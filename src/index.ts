import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import vehicleRoutes from "./routes/vehicle.routes";
import spaceRoutes from "./routes/space.routes";
import tariffRoutes from "./routes/tariff.routes";
import passRoutes from "./routes/pass.routes";
import parkingRoutes from "./routes/parking.routes";
import historyRoutes from "./routes/history.routes";
import reportRoutes from "./routes/report.routes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/spaces", spaceRoutes);
app.use("/tariffs", tariffRoutes);
app.use("/passes", passRoutes);
app.use("/parking", parkingRoutes);
app.use("/history", historyRoutes);
app.use("/reports", reportRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
