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
        templateSignatures: (templateId: string) =>
            ["certificates", "template-signatures", templateId] as const,
    },
    gamification: {
        xpRules: ["gamification", "xp-rules"] as const,
        levels: ["gamification", "levels"] as const,
        badges: ["gamification", "badges"] as const,
        badgeEarnedCounts: ["gamification", "badge-earned-counts"] as const,
    },
    settings: {
        dashboard: ["settings", "dashboard"] as const,
        institution: ["settings", "institution"] as const,
        subscription: ["settings", "subscription"] as const,
        smtp: ["settings", "smtp"] as const,
        adminAccount: (userId?: string) =>
            (userId
                ? (["settings", "admin-account", userId] as const)
                : (["settings", "admin-account"] as const)),
    },
    auditLogs: {
        all: ["audit-logs"] as const,
        list: (params?: { limit?: number; offset?: number }) =>
            ["audit-logs", "list", params?.limit ?? 50, params?.offset ?? 0] as const,
    },
    library: {
        search: (params: { q: string; page: number; pageSize: number }) =>
            ["library", "search", params] as const,
    },
    backoffice: {
        member: (userId?: string) => ["backoffice", "member", userId] as const,
    },
} as const;

