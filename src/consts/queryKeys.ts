export const queryKeys = {
    dashboard: {
        stats: ["dashboard", "stats"] as const,
    },
    courses: {
        list: ["courses", "list"] as const,
        detail: (courseId: string) => ["courses", "detail", courseId] as const,
        recentActivity: (courseId: string) => ["courses", "recent-activity", courseId] as const,
        students: (courseId: string) => ["courses", "students", courseId] as const,
        grades: (courseId: string) => ["courses", "grades", courseId] as const,
        content: (courseId: string) => ["courses", "content", courseId] as const,
    },
    students: {
        list: ["students", "list"] as const,
    },
    team: {
        list: ["team", "list"] as const,
    },
    certificates: {
        templates: ["certificates", "templates"] as const,
        signatures: ["certificates", "signatures"] as const,
        issues: ["certificates", "issues"] as const,
    },
    gamification: {
        xpRules: ["gamification", "xp-rules"] as const,
        levels: ["gamification", "levels"] as const,
        badges: ["gamification", "badges"] as const,
        badgeEarnedCounts: ["gamification", "badge-earned-counts"] as const,
    },
} as const;

