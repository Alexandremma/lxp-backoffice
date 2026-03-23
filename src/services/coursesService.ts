import { supabase } from "@/lib/supabaseClient"
import type { Course } from "@/lib/mock-data"

type CourseDbRow = {
    id: string
    name: string
    description: string | null
    status: string
    created_at: string
}

export type CourseEnrollment = {
    courseId: string
    courseName: string
    enrollmentDate: string
    progress: number
    status: "active" | "inactive" | "completed" | "cancelled"
}

export type CourseStudentRow = {
    id: string // lxp_profiles.id
    name: string
    email: string
    avatar?: string
    status: "active" | "inactive" | "blocked"
    lastAccess?: string | null
    enrollments: CourseEnrollment[]
}

export type StudentOption = {
    id: string
    name: string
    email: string
    avatar?: string
    status: "active" | "inactive" | "blocked"
    enrollmentCount: number
}

export async function getCoursesAdmin(): Promise<Course[]> {
    const { data: coursesData, error: coursesError } = await supabase
        .from("lxp_courses")
        .select("id,name,description,status,created_at")
        .order("created_at", { ascending: false })

    if (coursesError) throw coursesError

    // Semana 1: Total de alunos por curso (por enquanto via lxp_enrollments)
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("lxp_enrollments")
        .select("course_id")

    if (enrollmentsError) throw enrollmentsError

    const countsByCourseId = new Map<string, number>()
    ;(enrollmentsData ?? []).forEach((e: { course_id: string }) => {
        countsByCourseId.set(e.course_id, (countsByCourseId.get(e.course_id) ?? 0) + 1)
    })

    const mapped: Course[] = (coursesData ?? []).map((c) => {
        const row = c as CourseDbRow
        return {
            id: row.id,
            name: row.name,
            description: row.description ?? "",
            category: "graduation",
            status: (row.status as Course["status"]) ?? "draft",
            periods: 8,
            totalStudents: countsByCourseId.get(row.id) ?? 0,
            createdAt: row.created_at,
            externalLibraryId: undefined,
        }
    })

    return mapped
}

export async function getCourseDetailAdmin(courseId: string): Promise<Course | undefined> {
    const { data, error } = await supabase
        .from("lxp_courses")
        .select("id,name,description,status,created_at")
        .eq("id", courseId)
        .maybeSingle()

    if (error) throw error
    if (!data) return undefined

    const row = data as CourseDbRow
    const mapped: Course = {
        id: row.id,
        name: row.name,
        description: row.description ?? "",
        category: "graduation",
        status: (row.status as Course["status"]) ?? "draft",
        periods: 8,
        totalStudents: 0,
        createdAt: row.created_at,
        externalLibraryId: undefined,
    }

    return mapped
}

export async function getCourseStudentsAdmin(courseId: string, courseName: string): Promise<{
    enrolledStudents: CourseStudentRow[]
    allStudents: StudentOption[]
}> {
    // 1) Buscar enrollments do curso
    const { data: enr, error: enrError } = await supabase
        .from("lxp_enrollments")
        .select("student_profile_id,status,created_at")
        .eq("course_id", courseId)

    if (enrError) throw enrError

    const enrolledProfileIds = Array.from(
        new Set((enr ?? []).map((e: { student_profile_id: string }) => e.student_profile_id)),
    )

    // 2) Buscar perfis (alunos) matriculados
    let enrolledProfiles: Array<{ id: string; name: string | null; email: string | null }> = []
    if (enrolledProfileIds.length > 0) {
        const { data: prof, error: profError } = await supabase
            .from("lxp_profiles")
            .select("id,name,email")
            .in("id", enrolledProfileIds)

        if (profError) throw profError
        enrolledProfiles = (prof ?? []) as typeof enrolledProfiles
    }

    const enrMap = new Map<string, { created_at: string; status: string }>()
    ;(enr ?? []).forEach((e: { student_profile_id: string; created_at: string; status: string }) =>
        enrMap.set(e.student_profile_id, { created_at: e.created_at, status: e.status }),
    )

    const enrolledRows: CourseStudentRow[] = enrolledProfiles.map((p) => {
        const enrInfo = enrMap.get(p.id)
        return {
            id: p.id,
            name: p.name ?? p.email ?? p.id,
            email: p.email ?? "",
            avatar: "/placeholder.svg",
            status: "active",
            lastAccess: null,
            enrollments: [
                {
                    courseId,
                    courseName,
                    enrollmentDate: enrInfo?.created_at ?? new Date().toISOString(),
                    progress: 0,
                    status: (enrInfo?.status as CourseEnrollment["status"]) ?? "active",
                },
            ],
        }
    })

    // 3) Buscar todos os alunos (para o modal), com contagem de matrículas
    const { data: all, error: allError } = await supabase
        .from("lxp_profiles")
        .select("id,name,email")
        .eq("role", "student")
        .order("created_at", { ascending: false })

    if (allError) throw allError

    const { data: allEnr, error: allEnrError } = await supabase
        .from("lxp_enrollments")
        .select("student_profile_id")

    if (allEnrError) throw allEnrError

    const counts = new Map<string, number>()
    ;(allEnr ?? []).forEach((e: { student_profile_id: string }) => {
        counts.set(e.student_profile_id, (counts.get(e.student_profile_id) ?? 0) + 1)
    })

    const options: StudentOption[] = (all ?? []).map((p: { id: string; name: string | null; email: string | null }) => ({
        id: p.id,
        name: p.name ?? p.email ?? p.id,
        email: p.email ?? "",
        avatar: "/placeholder.svg",
        status: "active",
        enrollmentCount: counts.get(p.id) ?? 0,
    }))

    return { enrolledStudents: enrolledRows, allStudents: options }
}

export async function enrollStudentsAdmin(courseId: string, studentIds: string[]): Promise<void> {
    const toInsert = studentIds.map((id) => ({
        student_profile_id: id,
        course_id: courseId,
        status: "active",
    }))

    if (toInsert.length === 0) return

    const { error } = await supabase.from("lxp_enrollments").insert(toInsert)
    if (error) throw error
}
