// --- Filtros Genéricos ---
export type NumberFilter = {
    eq?: number;
    neq?: number;
    gt?: number;
    gte?: number;
    lt?: number;
    lte?: number;
};

export type StringFilter = {
    eq?: string;
    contains?: string;
    startsWith?: string;
};

export type BooleanFilter = {
    eq?: boolean;
    neq?: boolean;
};

export type FilterBuilder<T> = {
    [K in keyof T]?: T[K] extends number | undefined
        ? NumberFilter | number
        : T[K] extends string | undefined
          ? StringFilter | string
          : T[K] extends boolean | undefined
            ? BooleanFilter | boolean
            : T[K];
};

export interface GradeQueryFields {
    //                                                ▲
    schoolYear?: number; // Ex: "2"                   | mais abrangente
    targetBimester?: number; // 1, 2, 3, 4            |
    subjectName?: string; // Ex: "Matemática", "Mat"  |
    isRecovery?: boolean; // Se ficou de recuperação  |
    recoveryCode?: string; // Ex: "SAT"               |
    grade?: number; // Nota do aluno                  |
    classAverage?: number; // Média da turma          | menos abrangente (n necessariamente é menos abrangente).
}

export interface QueryFilter extends FilterBuilder<GradeQueryFields> {}
