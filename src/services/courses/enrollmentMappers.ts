import type { CourseEnrollment } from "@/types/courseEnrollments"

const ENROLLMENT_STATUS_MAP: Record<string, CourseEnrollment["status"]> = {
    active: "active",
    inactive: "inactive",
    blocked: "inactive",
    completed: "completed",
    cancelled: "cancelled",
}

export function normalizeEnrollmentStatus(raw: string): CourseEnrollment["status"] {
    return ENROLLMENT_STATUS_MAP[raw] ?? "active"
}

export function deriveStudentStatus(rawStatuses: string[]): "active" | "inactive" | "blocked" {
    if (rawStatuses.some((status) => status === "blocked")) return "blocked"
    if (rawStatuses.some((status) => status === "inactive")) return "inactive"
    return "active"
}
