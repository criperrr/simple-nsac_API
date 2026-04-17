import { Pool, QueryResultRow } from "pg";
import "dotenv/config";

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "postgres",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
});


const creationQueries = `
CREATE TABLE IF NOT EXISTS Accounts (
    user_id       SERIAL PRIMARY KEY,
    nsac_email    TEXT        NOT NULL UNIQUE,
    nsac_hash_pass TEXT,
    nsac_pass TEXT       NOT NULL,
    nsac_crypted_cookies TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ApiTokens (
    id_token SERIAL PRIMARY KEY,
    id_user  INTEGER     NOT NULL,
    token    TEXT        NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (id_user) REFERENCES Accounts(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS SchoolYears (
    id_year               SERIAL PRIMARY KEY,
    id_user               INTEGER     NOT NULL,
    year                  INTEGER     NOT NULL,
    status                TEXT        NOT NULL,
    title                 TEXT        NOT NULL,
    FOREIGN KEY (id_user) REFERENCES Accounts(user_id) ON DELETE CASCADE,
    UNIQUE(id_user, year)
);

CREATE TABLE IF NOT EXISTS Subjects (
    id_subject  SERIAL PRIMARY KEY,
    id_year     INTEGER     NOT NULL,
    abbreviation TEXT       NOT NULL,
    name        TEXT        NOT NULL,
    FOREIGN KEY (id_year) REFERENCES SchoolYears(id_year) ON DELETE CASCADE,
    UNIQUE(name, id_year)
);

CREATE TABLE IF NOT EXISTS Grades (
    id_grade    SERIAL PRIMARY KEY,
    id_user     INTEGER     NOT NULL,
    id_subject  INTEGER     NOT NULL,
    bimester    SMALLINT    NOT NULL CHECK (bimester BETWEEN 1 AND 4),
    grade       NUMERIC(5,2),
    averageGrade NUMERIC(5,2),
    statusRec   status_rec              DEFAULT 'NAC',
    recMessage  recovery_message_status DEFAULT 'Não aconteceu',
    approved    BOOLEAN                 DEFAULT TRUE,
    recovered   BOOLEAN                 DEFAULT NULL,
    FOREIGN KEY (id_user)    REFERENCES Accounts(user_id)    ON DELETE CASCADE,
    FOREIGN KEY (id_subject) REFERENCES Subjects(id_subject) ON DELETE CASCADE,
    UNIQUE(id_user, id_subject, bimester)
);`


export async function ensureDatabase() {
    try {
        await pool.query(creationQueries);
    } catch (error) {
        console.error("Error ensuring database:", error);
    }
}

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

// Retorna uma única linha - n sei ate que ponto isso é util
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
