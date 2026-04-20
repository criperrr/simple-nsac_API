import {
    getSql,
    insertSql,
    queryOne,
} from "../../../../shared/database/database.js";
import { InternalError } from "../../../../shared/errors/ApiError.js";
import {
    Subject,
    CreateGradeDTO,
    Grade,
    CreateSubjectDTO,
    CreateSchoolYearDTO,
    SchoolYear,
    CreateBimestersDTO,
    Bimesters,
    CreateSubjectFinalResultDTO,
    SubjectFinalResult,
} from "./grade.dto.js";
export async function createSchoolYear(
    yearData: CreateSchoolYearDTO,
): Promise<SchoolYear> {
    const result = await insertSql<SchoolYear>(
        `INSERT INTO SchoolYears (year, title) 
         VALUES ($1, $2)`,
        [yearData.year, yearData.title],
    );

    if (!result) throw new InternalError("cannot create:\n" + result);

    return result;
}

export async function getYearById(yearId: number): Promise<SchoolYear> {
    const result = await queryOne<SchoolYear>(
        "SELECT * FROM SchoolYears WHERE id_year = $1",
        [yearId],
    );

    if (!result) throw new InternalError("result:\n" + result);

    return result;
}

export async function getYearByYear(year: number): Promise<SchoolYear> {
    const result = await queryOne<SchoolYear>(
        "SELECT * FROM SchoolYears WHERE year = $1",
        [year],
    );

    if (!result) throw new InternalError("result:\n" + result);

    return result;
}

export async function getYearsCountByUID(userID: number): Promise<number> {
    const sql = "SELECT COUNT(*) as total FROM SchoolYears WHERE id_user = $1";

    const result = await queryOne<{ total: string }>(sql, [userID]);

    return result ? parseInt(result.total, 10) : 0;
}

export async function createSubject(
    subjectData: CreateSubjectDTO,
): Promise<Subject> {
    const result = await insertSql<Subject>(
        `INSERT INTO Subjects (id_year, abbreviation, name) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (name, id_year) DO UPDATE SET abbreviation = EXCLUDED.abbreviation`,
        [subjectData.id_year, subjectData.abbreviation, subjectData.name],
    );

    if (!result) throw new InternalError("cannot create:\n" + result);

    return result;
}

export async function getSubjectByNameAndYear(
    subjectName: string,
    id_year: number
): Promise<Subject | null> {
    return await queryOne<Subject>("SELECT * FROM Subjects WHERE name = $1 AND id_year = $2", [
        subjectName,
        id_year
    ]);
}

export async function createGrade(gradeData: CreateGradeDTO): Promise<void> {
    await insertSql(
        `INSERT INTO Grades (id_user, id_bimester, absences, id_subject, grade, averageGrade, statusRec, recMessage, approved, recovered) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id_user, id_subject, id_bimester) DO UPDATE SET 
            grade = EXCLUDED.grade, 
            averageGrade = EXCLUDED.averageGrade, 
            statusRec = EXCLUDED.statusRec, 
            recMessage = EXCLUDED.recMessage, 
            approved = EXCLUDED.approved, 
            recovered = EXCLUDED.recovered;`,
        [
            gradeData.id_user,
            gradeData.id_bimester,
            gradeData.absences,
            gradeData.id_subject,
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
        SELECT * FROM Grades WHERE id_user = $1
        `,
        [userId],
    );
}

export interface GradeBoletimRow extends Grade {
    subjectName: string;
    id_year: number;
    year: number;
    title: string;
    status: string;
    userAverage: number;
    classAverage: number;
    absences: number;
    bimesterTotalAbsences: number;
    final_grade: number;
    subject_total_absences: number;
}

export async function getBoletimDataRowsByUser(
    userId: number,
): Promise<GradeBoletimRow[]> {
    return await getSql<GradeBoletimRow>(
        `
        SELECT
            g.id_grade,
            g.id_user,
            g.id_subject,
            g.bimester,
            g.grade,
            g.averageGrade,
            g.absences,
            g.statusRec AS "statusRec",
            g.recMessage AS "recMessage",
            g.approved,
            g.recovered,
            s.name AS "subjectName",
            s.id_year,
            sy.year,
            sy.title,
            sy.status,
            b.userAvarage AS "userAverage",
            b.classAvarage AS "classAverage",
            b.totalAbsences AS "bimesterTotalAbsences",
            sfr.final_grade AS "final_grade",
            sfr.total_absences AS "subject_total_absences"
        FROM Grades g
        JOIN Subjects s ON g.id_subject = s.id_subject
        JOIN SchoolYears sy ON s.id_year = sy.id_year
        LEFT JOIN Bimesters b ON g.id_user = b.id_user AND s.id_year = b.id_year AND g.bimester = b.bimester
        LEFT JOIN SubjectFinalResults sfr ON g.id_user = sfr.id_user AND g.id_subject = sfr.id_subject
        WHERE g.id_user = $1
        ORDER BY sy.year, s.name, g.bimester;
        `,
        [userId],
    );
}

export async function createBimester(
    bimesterData: CreateBimestersDTO,
): Promise<Bimesters> {
    const result = await insertSql<Bimesters>(
        "INSERT INTO Bimesters(id_user, id_year, bimester, userAvarage, classAvarage, totalAbsences) VALUES ($1, $2, $3, $4, $5, $6)",
        [
            bimesterData.id_user,
            bimesterData.id_year,
            bimesterData.bimester,
            bimesterData.userAvarage,
            bimesterData.classAvarage,
            bimesterData.totalAbsences,
        ],
    );

    if (!result) throw new InternalError("result:\n" + result);

    return result;
}

export async function getBimesterByNum(
    bimesterNum: number,
): Promise<Bimesters> {
    const result = await queryOne<Bimesters>(
        "SELECT * FROM Bimesters WHERE bimester = $1",
        [bimesterNum],
    );

    if (!result) throw new InternalError("result:\n" + result);

    return result;
}

export async function createSubjectFinalResult(
    finalResultData: CreateSubjectFinalResultDTO,
): Promise<SubjectFinalResult> {
    const result = await insertSql<SubjectFinalResult>(
        `INSERT INTO SubjectFinalResults(id_user, id_subject, final_grade, total_absences) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (id_user, id_subject) DO UPDATE SET final_grade = EXCLUDED.final_grade, total_absences = EXCLUDED.total_absences`,
        [
            finalResultData.id_user,
            finalResultData.id_subject,
            finalResultData.final_grade,
            finalResultData.total_absences,
        ],
    );

    if (!result) throw new InternalError("result:\n" + result);

    return result;

}

export async function getSubjectFinalResultBySubjectId(
    subjectId: number,
): Promise<SubjectFinalResult> {
    const result = await queryOne<SubjectFinalResult>(
        "SELECT * FROM SubjectFinalResults WHERE id_subject = $1",
        [subjectId],
    );

    if (!result) throw new InternalError("result:\n" + result);

    return result;
}