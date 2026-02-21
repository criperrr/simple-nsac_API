export type RecoveryStatusCode = "SAT" | "INS" | "NC" | "NAC";
export type RecoveryMessage =
    | "Satisfatório"
    | "Insatisfatório"
    | "Não Compareceu"
    | "Não aconteceu";

export interface PersonalBiInformation {
    grade: number;
    absences: number;
    recovery: boolean;
    recovered?: boolean;
    recoveryCode?: RecoveryStatusCode;
    recoveryMessage?: RecoveryMessage;
}

export interface ClassBiInformation {
    averageGrade: number;
}

export interface UnifiedBimesterData {
    bimester: number;
    personal: PersonalBiInformation;
    class: ClassBiInformation;
}

export interface ResultData {
    grade: number;
    totalAbsences: number;
}

export interface FullGrades {
    subjectName: string;
    results: ResultData;
    bimesters: Array<UnifiedBimesterData>;
}

export interface BimesterData {
    userAverage: number;
    classAverage: number;
    totalAbsences: number;
}

export interface YearInfo {
    title: string;
    year: number;
    status: string;
    grades: Array<FullGrades>;
    bimestersMetrics: Array<BimesterData>;
}

export interface BoletimData {
    yearCount: number;
    yearsInfo: Array<YearInfo>;
}
