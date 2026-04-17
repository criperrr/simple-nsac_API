import { insertSql, getSql, queryOne } from "../../shared/database/database.js";
import { AppError, InternalError } from "../../shared/errors/ApiError.js";
import { getUserByEmail } from "../accounts/account.repository.js";
import {
    Subject,
    CreateGradeDTO,
    Grade,
    CreateSubjectDTO,
    CreateSchoolYearDTO,
    SchoolYear,
} from "./grade.dto.js";

export async function createGrade(
    grade: CreateGradeDTO,
    subject?: Subject,
): Promise<Grade> {
    const email = grade.nsac_email;
    // It reaches this part only when email is valid for NSAC
    const account = await getUserByEmail(email);
    if (!account) {
        throw new AppError("Account not found", 404, "ACCOUNT_NOT_FOUND");
    }

    const subjectTest = await getSubjectById(grade.id_subject);

    if (!subjectTest && !subject) {
        throw new AppError("Subject not found", 404, "SUBJECT_NOT_FOUND");
    }

    const subjectResult = await createSubject({
        name: subject?.name || subjectTest!.name,
        abbreviation: subject?.abbreviation || subjectTest!.abbreviation,
        id_year: subject?.id_year || subjectTest!.id_year,
    });

    const result = await insertSql<Grade>(
        `INSERT INTO Grades (id_user, id_subject, id_bimester, grade, averageGrade, statusRec, recMessage, approved, recovered)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
            account.user_id,
            grade.id_subject,
            grade.id_bimester,
            grade.grade,
            grade.averageGrade,
            grade.statusRec,
            grade.recMessage,
            grade.approved,
            grade.recovered,
        ],
    );
    if (!result) {
        throw new InternalError("Failed to create grade\nResult: " + result);
    }
    return result;
}

export async function getGradesByEmail(email: string): Promise<Grade[]> {
    const account = await getUserByEmail(email);
    if (!account) {
        throw new AppError("Account not found", 404, "ACCOUNT_NOT_FOUND");
    }
    const result = await getSql<Grade>(
        "SELECT * FROM Grades WHERE id_user = $1;",
        [account.user_id],
    );
    return result;
}

export async function createSubject(
    subject: CreateSubjectDTO,
): Promise<Subject> {
    const result = await insertSql<Subject>(
        "INSERT INTO Subjects (name, abbreviation, id_year) VALUES ($1, $2, $3) RETURNING *;",
        [subject.name, subject.abbreviation, subject.id_year],
    );
    if (!result) {
        throw new InternalError("Failed to create subject");
    }
    return result;
}

export async function getSubjectById(
    id_subject: number,
): Promise<Subject | null> {
    const result = await queryOne<Subject>(
        "SELECT * FROM Subjects WHERE id_subject = $1;",
        [id_subject],
    );
    return result;
}

export async function createSchoolYear(
    year: CreateSchoolYearDTO,
): Promise<SchoolYear> {
    const result = await insertSql<SchoolYear>(
        "INSERT INTO SchoolYears (id_user, year, averageUserGrade, averageClassGrade, totalAbsences) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
        [
            year.id_user,
            year.year,
            year.averageUserGrade,
            year.averageClassGrade,
            year.totalAbsences,
        ],
    );
    if (!result) {
        throw new InternalError("Failed to create school year");
    }
    return result;
}

export async function getSchoolYearsByUserId(
    id_user: number,
): Promise<SchoolYear[]> {
    const result = await getSql<SchoolYear>(
        "SELECT * FROM SchoolYears WHERE id_user = $1;",
        [id_user],
    );
    return result;
}
