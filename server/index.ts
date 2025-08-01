import dotenv from "dotenv";
dotenv.config(); // Ataovy eo ambony indrindra, mialoha ny fampiasana process.env

import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

registerRoutes(app)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Failed to register routes:", err);
    process.exit(1);
  });
