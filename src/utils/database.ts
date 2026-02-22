import sqlite3 from "sqlite3";
import "dotenv/config";

const dbPath = process.env.DBPATH || "./data.db";

let db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database:", err);
    } else {
        console.log("Connected to SQLite database at", dbPath);
    }
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Error handler
db.on("error", (err) => {
    console.log("Error in db connection:", err);
});

const createUserTable = `
CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nsac_email TEXT NOT NULL,
    nsac_hash_pass TEXT NOT NULL,
    nsac_crypted_cookies TEXT
)
`;

export async function ensureDbCreated() {
    return new Promise<void>((resolve, reject) => {
        db.run(createUserTable, (err) => {
            if (err) {
                console.error("Error creating tables:", err);
                reject(err);
            } else {
                console.log("Tables ensured.");
                resolve();
            }
        });
    });
}

// preguiça de mudar o projeto inteiro
// eu tava usando sqlite antes, mudei pra postgresql
// SQLite uses ? for placeholders natively, no need to normalize

export default db;

export async function runSql(sql: string, params: Array<any> = []): Promise<number> {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

export async function queryOne<T>(sql: string, params: Array<any> = []): Promise<T> {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row as T);
            }
        });
    });
}

export async function insertSql(sql: string, params: Array<any> = []): Promise<number> {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

export async function getSql<T>(sql: string, params: Array<any> = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows as T[]);
            }
        });
    });
}
