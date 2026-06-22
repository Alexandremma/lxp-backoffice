import type { LessonAccessMode } from "@/types/discipline"

export type CourseDisciplineAdmin = {
    id: string
    periodId: string
    name: string
    code: string
    workload: number
    credits: number
    creditsEnabled: boolean
    professor?: string
    description?: string
    coverImagePath?: string
    status: "active" | "inactive"
    lessonAccessMode: LessonAccessMode
    linkedTrailId?: string
    linkedTrailName?: string
    linkedLibraryLinkId?: string
}

export type CoursePeriodAdmin = {
    id: string
    courseId: string
    number: number
    name: string
    status: "current" | "completed" | "upcoming"
    disciplines: CourseDisciplineAdmin[]
}
