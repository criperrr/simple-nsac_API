import crypto from "crypto";
const cryptoAlgorithm = "aes-256-cbc";
import "dotenv/config";

const secret = process.env.ENCRYPTIONKEY as string;
if (!secret) throw new Error("No key defined.");
const key = Buffer.from(secret, "hex");

export function encrypt(message: string): string {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(cryptoAlgorithm, key, iv);

    let crypted = cipher.update(message, "utf8", "hex");
    crypted += cipher.final("hex");

    return `${crypted}:${iv.toString("hex")}`;
}

export function decrypt(message: string): string {
    const parts = message.split(":");

    if (parts.length !== 2) {
        throw new Error("Invalid data format: expected 'crypted:iv'");
    }

    const [crypted, ivHex] = parts;

    if (!crypted || !ivHex) {
        throw new Error("Invalid data: crypted or iv part is empty");
    }

    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv(cryptoAlgorithm, key, iv);

    let decrypted = "";
    try {
        decrypted = decipher.update(crypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
    } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Decryption failed due to invalid key, IV, or corrupted data.");
    }

    return decrypted;
}

export function generateRandomString(length: number, upperCase: boolean = true) {
    return upperCase
        ? crypto.randomBytes(length).toString("hex").toUpperCase()
        : crypto.randomBytes(length).toString("hex");
}
