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

export async function insertScrappingData(
    user: Account,
    authToken: string,
): Promise<void> {
    console.log("Starting data insertion for user:", user.id_user);
    const startTime = Date.now();
    const scraperResponse = await getGrades(authToken);
    const yearsData = scraperResponse.data;

    const promisesArr = [];

    for (const year of yearsData) {
        const yearResult = await createSchoolYear({
            year: year.year,
            title: year.title,
        });
        const yearUserAssociation = createAccountSchoolYear({
            id_user: user.id_user,
            id_year: yearResult.id_year,
            status: year.status,
        });

        promisesArr.push(yearUserAssociation);

        for (const subjectData of year.grades) {
            const generatedAbbreviation = subjectData.subjectName
                .substring(0, 3)
                .toUpperCase();

            let subjectResult =
                (await getSubjectByNameAndYear(
                    subjectData.subjectName,
                    yearResult.id_year,
                )) ??
                (await createSubject({
                    id_year: yearResult.id_year,
                    name: subjectData.subjectName,
                    abbreviation: generatedAbbreviation,
                }));


            const finalResultsObj = createSubjectFinalResult({
                id_user: user.id_user,
                id_subject: subjectResult.id_subject,
                final_grade: subjectData.results.grade,
                total_absences: subjectData.results.totalAbsences,
            });
            promisesArr.push(finalResultsObj);

            for (const bimesterData of subjectData.bimesters) {
                const { personal, class: classInfo } = bimesterData;
                const bimesterResult = await createBimester({
                    id_user: user.id_user,
                    id_year: yearResult.id_year,
                    bimester: bimesterData.bimester,
                    userAvarage: personal.grade,
                    classAvarage: classInfo.averageGrade,
                    totalAbsences: personal.absences,
                });
                const gradeObject = createGrade({
                    id_user: user.id_user,
                    id_subject: subjectResult.id_subject,
                    id_bimester: bimesterResult.id_bimester,
                    absences: personal.absences,
                    grade: personal.grade,
                    averageGrade: classInfo.averageGrade,
                    statusRec: personal.recoveryCode ?? "NAC",
                    recMessage: personal.recoveryMessage ?? "Não aconteceu",
                    approved: personal.grade >= 6,
                    recovered: personal.recovered ?? null,
                });
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
}
