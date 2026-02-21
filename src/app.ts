const useServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME; // Auto injected env variable from AWS

import e from "express";
if (!useServerless) require("dotenv").config(); // sorry
import nsacRoutes from "./routes/v1/nsacRoutes.js";
import serverless from "serverless-http";
import cors from "cors";
import { globalErrorHandling } from "./utils/errorHandler.js";
const app = e();

app.set("query parser", "extended");
app.use(e.json());
app.use(e.urlencoded({ extended: true }));
app.use(cors());

if (!useServerless) {
    const port = process.env.PORT || 3000;
    app.listen(port, async () => {
        console.log(`RUNNING at ${port}!`);
        // console.log("Trying to connect to PostgreSQL database and ensure all tables are created!");
        // await ensureDbCreated();
        // if you want to use function above import ensureDbCreated from database.ts
    });
}

app.use("/api/nsac", nsacRoutes);

app.use(globalErrorHandling);

export const handler = serverless(app, { provider: "aws" });
