CREATE TYPE status_rec AS ENUM ('SAT', 'INS', 'NC', 'NAC');

CREATE TYPE recovery_message_status AS ENUM (
    'Satisfatório',
    'Insatisfatório',
    'Não Compareceu',
    'Não aconteceu'
);

CREATE TABLE IF NOT EXISTS Accounts (
    user_id       SERIAL PRIMARY KEY,
    nsac_email    TEXT        NOT NULL UNIQUE,
    nsac_hash_pass TEXT       NOT NULL,
    nsac_crypted_cookies TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS SchoolYears (
    id_year               SERIAL PRIMARY KEY,
    id_user               INTEGER     NOT NULL,
    year                  INTEGER     NOT NULL,
    averageUserGrade      NUMERIC(5,2),
    averageClassGrade     NUMERIC(5,2),
    totalAbsences         INTEGER,
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
);