import * as cheerio from "cheerio";
import { verifyCookie } from "./verifyCookie.js";
import {
    FullGrades,
    RecoveryStatusCode,
    RecoveryMessage,
    ResultData,
    YearInfo,
    AllYearsResponse,
    BimesterData,
    UnifiedBimesterData,
    PersonalBiInformation,
    ClassBiInformation,
} from "../types/index.js";
import { AnyNode } from "domhandler";
interface BasicYearInfo {
    tittleLabel: string;
    parsedYear: number;
    parsedStatus: string;
}

function getSubjectName($: cheerio.CheerioAPI, row: cheerio.BasicAcceptedElems<any>): string {
    let schoolSubject: any = $(row).find("td:not(.text-center) span");
    const schoolSubjectAtrr = $(schoolSubject).attr("title");
    if (schoolSubjectAtrr) {
        return schoolSubjectAtrr.toString();
    } else {
        return $(schoolSubject).text().trim();
    }
}

function getBasicYearInfo(
    $: cheerio.CheerioAPI,
    table: cheerio.BasicAcceptedElems<AnyNode>
): BasicYearInfo {
    const titlesString = $(table)
        .find("div.box-header")
        .find("h4")
        .text()
        .trim()
        .replace(/\s/g, "")
        .split("/");

    let yearLabel = titlesString[1];
    const tittleLabel = titlesString[0]!;

    if (!yearLabel) {
        throw new Error("Erro ao extrair ano do cabeçalho da tabela");
    }

    let status = yearLabel.split("-");
    let parsedStatus: string;
    if (status.length > 1) {
        yearLabel = status[0];
        parsedStatus = status[1]!;
    } else {
        parsedStatus = "Cursando.";
    }

    const parsedYear = Number(yearLabel);
    return {
        tittleLabel,
        parsedYear,
        parsedStatus,
    };
}

function extractAndCleanGrade(pollutedString: string) {
    const regex = /(\d+\.?\d?)/;
    const match = pollutedString.match(regex);

    if (match && match[0]) {
        let cleanedString = match[0];
        cleanedString = cleanedString.replace(/[^\d.]/g, "");
        return Number(cleanedString);
    }
    return null;
}

async function fetchBoletimDOM(
    logToken: string, // Token de login
    APIToken?: string // Token da API
): Promise<cheerio.CheerioAPI> {
    const tokenResult = await verifyCookie(logToken, APIToken); // Se o logToken for invalido mas o APIToken n, ent ele retorna um logToken novo

    const response = await fetch("http://200.145.153.1/nsac/aluno/boletim", {
        credentials: "include",
        headers: {
            Cookie: tokenResult,
        },
        referrer: "http://200.145.153.1/nsac/login",
        method: "GET",
        mode: "cors",
    });

    const boletimHtml = await response.text();
    return cheerio.load(boletimHtml);
}

export async function getGrades(
    logToken: string,
    APIToken?: string,
    year?: number
): Promise<AllYearsResponse> {
    const MAX_BIMESTERS = 4;
    const $ = await fetchBoletimDOM(logToken, APIToken);

    const tables = $("div.box.box-primary").toArray().reverse();
    const userCurrentYear = tables.length;

    if (year === 0) year = userCurrentYear;

    let warning: string | boolean = false;
    let allYearsInfo: YearInfo[] = [];
    tables.forEach((table) => {
        const { parsedYear, tittleLabel, parsedStatus } = getBasicYearInfo($, table);

        let fullGradesObj: FullGrades[] = [];
        const bimesterAccumulators = Array.from({ length: MAX_BIMESTERS }, () => ({
            totalUserGrade: 0,
            countUserGrades: 0,
            totalClassGrade: 0,
            countClassGrades: 0,
            totalAbsences: 0,
        }));
        $(table)
            .find("tr.linha")
            .each((_, row) => {
                let bimesterObj: Array<UnifiedBimesterData> = [];
                const schoolSubject = getSubjectName($, row);

                let resultDataObj: ResultData = {
                    grade: 0,
                    totalAbsences: 0,
                };

                let personalResults: PersonalBiInformation = {
                    grade: 0,
                    recovered: false,
                    recovery: false,
                    recoveryCode: "NAC",
                    recoveryMessage: "Não aconteceu",
                    absences: 0,
                };

                let classResults: ClassBiInformation = {
                    averageGrade: 0,
                };

                const cells = $(row).find("td.text-center");
                const map: Array<string> = [
                    "userGrade",
                    "classGrade",
                    "absences",
                    "recoveryStatus",
                ];

                cells.each((cellIndex, cell) => {
                    const currentBimester = Math.floor(cellIndex / MAX_BIMESTERS);
                    const cellType = map[cellIndex % MAX_BIMESTERS];
                    if (cellIndex < 16) {
                        switch (cellType) {
                            case "userGrade":
                                const userGradeValue = extractAndCleanGrade($(cell).text());
                                if (userGradeValue !== null) {
                                    personalResults.grade = userGradeValue;
                                    bimesterAccumulators[currentBimester]!.totalUserGrade +=
                                        userGradeValue;
                                    bimesterAccumulators[currentBimester]!.countUserGrades++;
                                }
                                break;

                            case "classGrade":
                                const classGradeValue = extractAndCleanGrade($(cell).text());
                                if (classGradeValue !== null) {
                                    classResults.averageGrade = classGradeValue;
                                    bimesterAccumulators[currentBimester]!.totalClassGrade +=
                                        classGradeValue;
                                    bimesterAccumulators[currentBimester]!.countClassGrades++;
                                }
                                break;

                            case "absences":
                                const absences = Number($(cell).text().trim());
                                if (!isNaN(absences)) {
                                    personalResults.absences = absences;
                                    bimesterAccumulators[currentBimester]!.totalAbsences +=
                                        absences;
                                }
                                break;

                            case "recoveryStatus":
                                const lastSpanChild = $(cell).children().last();
                                const completeStatus = ($(lastSpanChild)
                                    .attr("title")
                                    ?.toString() || "Não aconteceu") as RecoveryMessage;
                                let statusCode = $(lastSpanChild).text().trim();
                                if (statusCode === "-") statusCode = "NAC";
                                const recoveryBool = ["SAT", "INS", "NC"].includes(statusCode);
                                if (recoveryBool) {
                                    personalResults = {
                                        ...personalResults,
                                        recovery: recoveryBool,
                                        recovered: personalResults.grade >= 6,
                                        recoveryCode: statusCode as RecoveryStatusCode,
                                        recoveryMessage: completeStatus,
                                    };
                                } else {
                                    const {
                                        recovered,
                                        recoveryCode,
                                        recoveryMessage,
                                        ...cleanGrades
                                    } = personalResults;
                                    personalResults = {
                                        ...cleanGrades,
                                        recovery: false,
                                    };
                                }
                                break;
                        }
                        if ((cellIndex + 1) % MAX_BIMESTERS === 0) {
                            // 4, 8, 12, 16 (bimestres 1, 2, 3, 4)
                            bimesterObj.push({
                                bimester: currentBimester + 1,
                                personal: { ...personalResults },
                                class: { ...classResults },
                            });
                        }
                    } else {
                        if (cellIndex == 16) {
                            const finalGrade = extractAndCleanGrade($(cell).text());
                            if (finalGrade === null) throw new Error("INVALID FINAL GRADE!");
                            resultDataObj.grade = finalGrade;
                        } else if (cellIndex == 17) {
                            const totalAbsences = Number($(cell).text().trim());
                            if (isNaN(totalAbsences))
                                throw new Error("INVALID FINAL ABSENCES GRADE!");
                            resultDataObj.totalAbsences = totalAbsences;
                        }
                    }
                });
                const currentSubject: FullGrades = {
                    subjectName: schoolSubject,
                    results: resultDataObj,
                    bimesters: bimesterObj,
                };

                fullGradesObj.push(currentSubject);
            });

        const calculatedBimesterData: BimesterData[] = bimesterAccumulators.map((acc) => ({
            userAverage:
                acc.countUserGrades > 0
                    ? Number((acc.totalUserGrade / acc.countUserGrades).toFixed(2))
                    : 0,
            classAverage:
                acc.countClassGrades > 0
                    ? Number((acc.totalClassGrade / acc.countClassGrades).toFixed(2))
                    : 0,
            totalAbsences: acc.totalAbsences,
        }));

        const resultYearInfo: YearInfo = {
            title: tittleLabel!,
            year: parsedYear,
            status: parsedStatus,
            grades: fullGradesObj,
            bimestersMetrics: calculatedBimesterData,
        };

        allYearsInfo.push(resultYearInfo);
    });

    return {
        warning,
        userCurrentYear,
        data: allYearsInfo,
    };
}
