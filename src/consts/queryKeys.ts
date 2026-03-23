export const queryKeys = {
    courses: {
        list: ["courses", "list"] as const,
        detail: (courseId: string) => ["courses", "detail", courseId] as const,
        students: (courseId: string) => ["courses", "students", courseId] as const,
    },
} as const;

