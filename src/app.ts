import express from "express";
import cors from "cors";
import { globalErrorHandling } from "./shared/middlewares/errorHandler.js";
import nsacRoutes from "./modules/nsac-scrapping/nsac.routes.js";


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/v1/nsac", nsacRoutes);

app.use(globalErrorHandling);

export default app; 