import "dotenv/config";
import app from "./app.js";
import serverless from "serverless-http";
import { ensureDatabase } from "./shared/database/database.js";
import { ensureLogDirectoryExists, logInfo } from "./shared/log/logger.js";
// import { ensureDbCreated } from "./shared/database/database.js";

const useServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!useServerless) {
    const port = process.env.PORT || 3000;
    app.listen(port, async () => {
        await ensureLogDirectoryExists();
        await logInfo(`Server RUNNING at http://localhost:${port}!`);
        await ensureDatabase();
    });
}

// Handler para AWS Lambda
export const handler = serverless(app, { provider: "aws" });
