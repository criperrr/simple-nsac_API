import { Pool, PoolClient, QueryResultRow } from "pg";
import "dotenv/config";

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "postgres",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
});

const creationQueries = `
CREATE TABLE IF NOT EXISTS SchoolYears (
    id_year               SERIAL PRIMARY KEY,
    year                  SMALLINT     NOT NULL,
    title                 TEXT        NOT NULL,
    
    UNIQUE(title, year)
);

CREATE TABLE IF NOT EXISTS Accounts (
    id_user       SERIAL PRIMARY KEY,
    nsac_email    TEXT        NOT NULL UNIQUE,
    nsac_hash_pass TEXT,
    nsac_pass TEXT       NOT NULL,
    nsac_crypted_cookies TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS Accounts_SchoolYears ( 
	id_association SERIAL PRIMARY KEY,
	id_user       INTEGER NOT NULL,
    id_year       INTEGER NOT NULL,
	status                TEXT        NOT NULL,
	FOREIGN KEY (id_user) REFERENCES Accounts(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_year) REFERENCES SchoolYears(id_year) ON DELETE CASCADE,
	UNIQUE(id_user, id_year)
);

CREATE TABLE IF NOT EXISTS ApiTokens (
    id_token SERIAL PRIMARY KEY,
    id_user  INTEGER     NOT NULL,
    token    TEXT        NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (id_user) REFERENCES Accounts(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Bimesters(
    id_bimester SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL,
    id_year INTEGER NOT NULL,
    bimester SMALLINT NOT NULL,
    userAvarage NUMERIC(5,2) NOT NULL,
    classAvarage NUMERIC(5,2) NOT NULL,
    totalAbsences SMALLINT NOT NULL,


    FOREIGN KEY(id_user) REFERENCES Accounts(id_user) ON DELETE CASCADE,
    FOREIGN KEY(id_year) REFERENCES SchoolYears(id_year) ON DELETE CASCADE,

    UNIQUE (id_bimester, id_user, id_year)
    
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
	id_bimester INTEGER     NOT NULL,
    grade       NUMERIC(5,1) NOT NULL,
    averageGrade NUMERIC(5,1) NOT NULL,
    absences SMALLINT NOT NULL,
    statusRec   status_rec              DEFAULT 'NAC',
    recMessage  recovery_message_status DEFAULT 'Não aconteceu',
    approved    BOOLEAN                 DEFAULT TRUE,
    recovered   BOOLEAN                 DEFAULT NULL,
    FOREIGN KEY (id_user)    REFERENCES Accounts(id_user)    ON DELETE CASCADE,
    FOREIGN KEY (id_subject) REFERENCES Subjects(id_subject) ON DELETE CASCADE,
    UNIQUE(id_user, id_subject, id_bimester)
);

CREATE TABLE IF NOT EXISTS SubjectFinalResults (
    id_result     SERIAL PRIMARY KEY,
    id_user       INTEGER NOT NULL,
    id_subject    INTEGER NOT NULL,
    final_grade   NUMERIC(5,1),
    total_absences SMALLINT NOT NULL DEFAULT 0,

    FOREIGN KEY (id_user)    REFERENCES Accounts(id_user)    ON DELETE CASCADE,
    FOREIGN KEY (id_subject) REFERENCES Subjects(id_subject) ON DELETE CASCADE,
    UNIQUE(id_user, id_subject)
);
`;

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
    client?: PoolClient
): Promise<number> {
    const result = await (client ? client.query(sql, params) : pool.query(sql, params));
    return result.rowCount ?? 0;
}

// Retorna uma única linha - n sei ate que ponto isso é util
export async function queryOne<T extends QueryResultRow>(
    sql: string,
    params: Array<any> = [],
    client?: PoolClient
): Promise<T | null> {
    const result = await (client ? client.query<T>(sql, params) : pool.query<T>(sql, params));
    return result.rows[0] ?? null;
}

// Retorna múltiplas linhas
export async function getSql<T extends QueryResultRow>(
    sql: string,
    params: Array<any> = [],
    client?: PoolClient
): Promise<T[]> {
    const result = await (client ? client.query<T>(sql, params) : pool.query<T>(sql, params));
    return result.rows;
}

// Executa uma query e retorna a linha afetada (usa RETURNING *)
export async function insertSql<T extends QueryResultRow>(
    sql: string,
    params: Array<any> = [],
    client?: PoolClient
): Promise<T | null> {
    sql = sql.endsWith(";")
        ? sql.slice(0, -1) + " RETURNING *;"
        : sql + " RETURNING *;";
    const result = await (client ? client.query<T>(sql, params) : pool.query<T>(sql, params));
    return result.rows[0] ?? null;
}
