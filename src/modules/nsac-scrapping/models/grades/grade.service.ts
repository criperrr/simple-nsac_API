import { Account } from "../accounts/account.dto.js";
import { getGrades } from "../../providers/getGrades.js";
import {
    createSchoolYear,
    createSubject,
    createGrade,
    createBimester,
    createSubjectFinalResult,
    getSubjectByNameAndYear,
} from "./grade.repository.js";
import { createAccountSchoolYear } from "../accounts/account.repository.js";
import pool from "../../../../shared/database/database.js";

export async function insertScrappingData(
    user: Account,
    authToken: string,
): Promise<void> {
    const scraperResponse = await getGrades(authToken);
    const yearsData = scraperResponse.data;
    console.log("Starting data insertion for user:", user.id_user);
    const startTime = Date.now();

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const promisesArr = [];

        for (const year of yearsData) {
            const yearResult = await createSchoolYear(
                {
                    year: year.year,
                    title: year.title,
                },
                client,
            );
            const yearUserAssociation = createAccountSchoolYear(
                {
                    id_user: user.id_user,
                    id_year: yearResult.id_year,
                    status: year.status,
                },
                client,
            );

            promisesArr.push(yearUserAssociation);

            for (const subjectData of year.grades) {
                const generatedAbbreviation = subjectData.subjectName
                    .substring(0, 3)
                    .toUpperCase();

                let subjectResult =
                    (await getSubjectByNameAndYear(
                        subjectData.subjectName,
                        yearResult.id_year,
                        client,
                    )) ??
                    (await createSubject(
                        {
                            id_year: yearResult.id_year,
                            name: subjectData.subjectName,
                            abbreviation: generatedAbbreviation,
                        },
                        client,
                    ));

                const finalResultsObj = createSubjectFinalResult(
                    {
                        id_user: user.id_user,
                        id_subject: subjectResult.id_subject,
                        final_grade: subjectData.results.grade,
                        total_absences: subjectData.results.totalAbsences,
                    },
                    client,
                );
                promisesArr.push(finalResultsObj);

                for (const bimesterData of subjectData.bimesters) {
                    const { personal, class: classInfo } = bimesterData;
                    const bimesterResult = await createBimester(
                        {
                            id_user: user.id_user,
                            id_year: yearResult.id_year,
                            bimester: bimesterData.bimester,
                            userAvarage: personal.grade,
                            classAvarage: classInfo.averageGrade,
                            totalAbsences: personal.absences,
                        },
                        client,
                    );
                    const gradeObject = createGrade(
                        {
                            id_user: user.id_user,
                            id_subject: subjectResult.id_subject,
                            id_bimester: bimesterResult.id_bimester,
                            absences: personal.absences,
                            grade: personal.grade,
                            averageGrade: classInfo.averageGrade,
                            statusRec: personal.recoveryCode ?? "NAC",
                            recMessage:
                                personal.recoveryMessage ?? "Não aconteceu",
                            approved: personal.grade >= 6,
                            recovered: personal.recovered ?? null,
                        },
                        client,
                    );
                    promisesArr.push(gradeObject);
                }
            }
        }
        await Promise.all(promisesArr);
        const endTime = Date.now();
        console.log(
            `Data insertion completed for user: ${user.id_user} in ${
                (endTime - startTime) / 1000
            } seconds.`,
        );

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(
            "Error during data insertion, transaction rolled back:",
            error,
        );
        throw error;
    } finally {
        client.release();
    }
}
