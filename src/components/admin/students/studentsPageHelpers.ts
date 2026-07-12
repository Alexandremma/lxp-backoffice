import { averageEnrollmentProgress } from "@/lib/studentCourseProgress"
import type { StudentAdmin as Student } from "@/types/studentAdmin"
import type { CourseStudentRow } from "@/types/courseEnrollments"

export type SortColumn = "name" | "enrollmentDate" | "progress" | "lastAccess"
export type SortDirection = "asc" | "desc"

export const statusConfig = {
  active: { label: "Ativo", variant: "success" as const },
  inactive: { label: "Inativo", variant: "secondary" as const },
  blocked: { label: "Bloqueado", variant: "destructive" as const },
}

export function courseRowToStudent(row: CourseStudentRow): Student {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: "student",
    status: row.status,
    enrollments: row.enrollments,
    lastAccess: row.lastAccess ?? new Date().toISOString(),
    createdAt: row.createdAt ?? new Date().toISOString(),
    avatarPath: row.avatarPath ?? null,
    avatarUpdatedAt: row.avatarUpdatedAt ?? null,
    phone: row.phone ?? null,
    birthDate: row.birthDate ?? null,
  }
}

export function calcAvgProgress(student: Student) {
  return averageEnrollmentProgress(student.enrollments.map((enrollment) => enrollment.progress))
}

export function getEarliestEnrollmentDate(student: Student) {
  if (student.enrollments.length === 0) return ""
  return student.enrollments.reduce(
    (earliest, e) => (e.enrollmentDate < earliest ? e.enrollmentDate : earliest),
    student.enrollments[0].enrollmentDate,
  )
}
