import { Account } from "../accounts/account.dto.js";
import { getGrades } from "../../providers/getGrades.js";
import { logInfo } from "../../../../shared/log/logger.js";
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
    await logInfo(`Starting data insertion for user: ${user.id_user}`);
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
        await logInfo(
            `Data insertion completed for user: ${user.id_user} in ${
                (endTime - startTime) / 1000
            } seconds`,
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


import { getBoletimDataRowsByUser } from "./grade.repository.js";
import {
    AllYearsResponse,
    YearInfo,
    UnifiedBimesterData,
    BimesterData,
    PersonalBiInformation,
} from "../../nsac.types.js";

export async function fetchUserGrades(user: Account): Promise<AllYearsResponse> {
    await logInfo(`Fetching parsed scraping data for user: ${user.id_user}`);

    const rows = await getBoletimDataRowsByUser(user.id_user);

    const yearsMap = new Map<number, YearInfo>();
    const bimestersMetricsMap = new Map<number, Map<number, BimesterData>>();
    let userCurrentYear = 0;

    for (const row of rows) {
        if (row.year > userCurrentYear) userCurrentYear = row.year;

        if (!yearsMap.has(row.year)) {
            yearsMap.set(row.year, {
                title: row.title,
                year: row.year,
                status: row.status,
                grades: [],
                bimestersMetrics: []
            });
            bimestersMetricsMap.set(row.year, new Map<number, BimesterData>());
        }

        const currentYearInfo = yearsMap.get(row.year)!;
        const currentYearMetrics = bimestersMetricsMap.get(row.year)!;

        // 3. Extrai as métricas gerais do bimestre (executa 1 vez por bimestre/ano)
        if (!currentYearMetrics.has(row.bimester) && row.userAverage != null) {
            currentYearMetrics.set(row.bimester, {
                userAverage: Number(row.userAverage),
                classAverage: Number(row.classAverage),
                totalAbsences: Number(row.bimesterTotalAbsences)
            });
        }

        // 4. Agrupa a matéria dentro do ano
        let subjectEntry = currentYearInfo.grades.find(g => g.subjectName === row.subjectName);
        if (!subjectEntry) {
            subjectEntry = {
                subjectName: row.subjectName,
                results: {
                    grade: Number(row.final_grade) || 0,
                    totalAbsences: Number(row.subject_total_absences) || 0
                },
                bimesters: []
            };
            currentYearInfo.grades.push(subjectEntry);
        }

        // 5. Mapeia a nota do respectivo bimestre
        const bimesterData: UnifiedBimesterData = {
            bimester: row.bimester as 1 | 2 | 3 | 4,
            personal: {
                grade: Number(row.grade),
                absences: Number(row.absences),
                recovery: row.statusRec !== "NAC",
                recovered: row.recovered ?? undefined,
                recoveryCode: row.statusRec,
                recoveryMessage: row.recMessage
            } as PersonalBiInformation,
            class: {
                averageGrade: Number(row.averageGrade)
            }
        };

        subjectEntry.bimesters.push(bimesterData);
    }

    // 6. Finaliza a montagem da estrutura mapeada e garante a ordenação
    const data: YearInfo[] = Array.from(yearsMap.values()).map(yearInfo => {
        const metricsMap = bimestersMetricsMap.get(yearInfo.year)!;
        
        // Converte as métricas do Map para Array ordenando pelas chaves (1º, 2º, 3º e 4º bimestre)
        yearInfo.bimestersMetrics = Array.from(metricsMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(entry => entry[1]);

        // Garante que as notas dos bimestres estejam cronológicas
        yearInfo.grades.forEach(grade => {
            grade.bimesters.sort((a, b) => a.bimester - b.bimester);
        });

        return yearInfo;
    });

    // Ordena os anos de forma decrescente (ano mais atual primeiro)
    data.sort((a, b) => b.year - a.year);

    return {
        warning: false, 
        userCurrentYear,
        data
    };
}