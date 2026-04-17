import { Pool, QueryResultRow } from "pg";
import "dotenv/config";

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "postgres",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
});

pool.on("error", (err) => {
    console.error("Unexpected error on idle client:", err);
});

pool.on("connect", () => {
    console.log("Connected to PostgreSQL database");
});

export default pool;

// Executa uma query sem retorno (INSERT, UPDATE, DELETE)
export async function runSql(
    sql: string,
    params: Array<any> = [],
): Promise<number> {
    const result = await pool.query(sql, params);
    return result.rowCount ?? 0;
}

// Retorna uma única linha
export async function queryOne<T extends QueryResultRow>(
    sql: string,
    params: Array<any> = [],
): Promise<T | null> {
    const result = await pool.query<T>(sql, params);
    return result.rows[0] ?? null;
}

// Retorna múltiplas linhas
export async function getSql<T extends QueryResultRow>(
    sql: string,
    params: Array<any> = [],
): Promise<T[]> {
    const result = await pool.query<T>(sql, params);
    return result.rows;
}

// Executa uma query e retorna a linha afetada (usa RETURNING *)
export async function insertSql<T extends QueryResultRow>(
    sql: string,
    params: Array<any> = [],
): Promise<T | null> {
    const result = await pool.query<T>(sql, params);
    return result.rows[0] ?? null;
}
