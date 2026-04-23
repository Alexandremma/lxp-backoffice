export const queryKeys = {
    courses: {
        list: ["courses", "list"] as const,
        detail: (courseId: string) => ["courses", "detail", courseId] as const,
        students: (courseId: string) => ["courses", "students", courseId] as const,
        grades: (courseId: string) => ["courses", "grades", courseId] as const,
        content: (courseId: string) => ["courses", "content", courseId] as const,
    },
    students: {
        list: ["students", "list"] as const,
    },
} as const;

