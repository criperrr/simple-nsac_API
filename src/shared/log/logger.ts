import fs from "fs/promises";
import path from "path";
import { AppError, InternalError } from "./errors/ApiError.js";

const logDirectory = path.join(process.cwd(), "logs");

// will be called on app.ts so we dont need to call it always
export async function ensureLogDirectoryExists() {
    try {
        await fs.mkdir(logDirectory, { recursive: true });
        await createLogFile();
    } catch (e) {
        throw new InternalError("Failed to create log directory:\n" + e);
    }
}

async function createLogFile(): Promise<void> {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const logFileName = `log-${timestamp}.txt`;
    const logFilePath = path.join(logDirectory, logFileName);

    try {
        await fs.writeFile(
            logFilePath,
            "INITIALIZE LOG FILE - " + now.toISOString() + "\n",
        );
    } catch (e) {
        console.error("Failed to write to log file:\n" + e);
    }
}

export async function logError<T extends AppError | InternalError | Error>(
    e: T,
): Promise<void> {
    let logString: string;
    const timestamp = new Date().toISOString();

    if (e instanceof InternalError) {
        const debugSection = e.debug ? `\n├─ Debug: ${e.debug}` : "";
        logString = `
╔══════════════════════════════════════════════════════════════
║ ERROR - [${timestamp}]
╠══════════════════════════════════════════════════════════════
│ Type: ${e.name}
│ Code: ${e.errorCode} (${e.HTTPCode})
│ Message: ${e.message}${e.field ? `\n│ Field: ${e.field}` : ""}${debugSection}
├─ Stack Trace:
│ ${e.stack ? e.stack.split("\n").join("\n│ ") : "No available stack trace"}${e.cause ? `\n├─ Cause:\n│ ${JSON.stringify(e.cause)}` : ""}
╚══════════════════════════════════════════════════════════════
        `;
    } else if (e instanceof AppError) {
        logString = `
╔══════════════════════════════════════════════════════════════
║ ERROR - [${timestamp}]
╠══════════════════════════════════════════════════════════════
│ Type: ${e.name}
│ Code: ${e.errorCode} (${e.HTTPCode})
│ Message: ${e.message}${e.field ? `\n│ Field: ${e.field}` : ""}
├─ Stack Trace:
│ ${e.stack ? e.stack.split("\n").join("\n│ ") : "No available stack trace"}${e.cause ? `\n├─ Cause:\n│ ${JSON.stringify(e.cause)}` : ""}
╚══════════════════════════════════════════════════════════════
        `;
    } else {
        logString = `
╔══════════════════════════════════════════════════════════════
║ ERROR - [${timestamp}]
╠══════════════════════════════════════════════════════════════
│ Type: ${e.name}
│ Message: ${e.message}
├─ Stack Trace:
│ ${e.stack ? e.stack.split("\n").join("\n│ ") : "No available stack trace"}${e.cause ? `\n├─ Cause:\n│ ${JSON.stringify(e.cause)}` : ""}
╚══════════════════════════════════════════════════════════════
        `;
    }

    try {
        const logFiles = await fs.readdir(logDirectory);
        const latestLogFile = logFiles.sort().reverse()[0] as string; // Cant be undefined because we create a log file on app initialization
        const logFilePath = path.join(logDirectory, latestLogFile);
        await fs.appendFile(logFilePath, logString + "\n");
    } catch (e) {
        console.error("Failed to write to log file:\n" + e);
    }
}

export async function logInfo(message: string): Promise<void> {
    const logString = `
[${new Date().toISOString()}]: INFO - ${message}
    `;

    try {
        const logFiles = await fs.readdir(logDirectory);
        const latestLogFile = logFiles.sort().reverse()[0] as string; 
        const logFilePath = path.join(logDirectory, latestLogFile);
        await fs.appendFile(logFilePath, logString + "\n");
    } catch (e) {
        console.error("Failed to write to log file:\n" + e);
    }
}
