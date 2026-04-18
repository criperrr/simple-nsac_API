import { getSql, insertSql } from "../../shared/database/database.js";
import { InternalError } from "../../shared/errors/ApiError.js";
import {
    Subject,
    CreateGradeDTO,
    Grade,
    CreateSubjectDTO,
    CreateSchoolYearDTO,
    SchoolYear,
} from "./grade.dto.js";
export async function createSchoolYear(
    yearData: CreateSchoolYearDTO,
): Promise<SchoolYear> {
    const result = await insertSql<SchoolYear>(
        `INSERT INTO SchoolYears (id_user, year, status, title) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (id_user, year) DO UPDATE SET status = EXCLUDED.status, title = EXCLUDED.title
         RETURNING *;`,
        [yearData.id_user, yearData.year, yearData.status, yearData.title],
    );

    if (!result) throw new InternalError("cannot create:\n" + result);

    return result;
}

export async function createSubject(
    subjectData: CreateSubjectDTO,
): Promise<Subject> {
    const result = await insertSql<Subject>(
        `INSERT INTO Subjects (id_year, abbreviation, name) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (name, id_year) DO UPDATE SET abbreviation = EXCLUDED.abbreviation
         RETURNING *;`,
        [subjectData.id_year, subjectData.abbreviation, subjectData.name],
    );

    if (!result) throw new InternalError("cannot create:\n" + result);

    return result;
}

export async function createGrade(gradeData: CreateGradeDTO): Promise<void> {
    await insertSql(
        `INSERT INTO Grades (id_user, id_subject, bimester, grade, averageGrade, statusRec, recMessage, approved, recovered) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id_user, id_subject, bimester) DO UPDATE SET 
            grade = EXCLUDED.grade, 
            averageGrade = EXCLUDED.averageGrade, 
            statusRec = EXCLUDED.statusRec, 
            recMessage = EXCLUDED.recMessage, 
            approved = EXCLUDED.approved, 
            recovered = EXCLUDED.recovered;`,
        [
            gradeData.id_user,
            gradeData.id_subject,
            gradeData.bimester,
            gradeData.grade,
            gradeData.averageGrade,
            gradeData.statusRec,
            gradeData.recMessage,
            gradeData.approved,
            gradeData.recovered,
        ],
    );
}

export async function getGradesFromDb(userId: number): Promise<Grade[]> {
    return await getSql<Grade>(
        `
        SELECT * FROM Grades (id_user) WHERE $1 
        `,
        [userId],
    );
}
