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

export type CourseDisciplineAdmin = {
    id: string
    periodId: string
    name: string
    code: string
    workload: number
    credits: number
    professor?: string
    status: "active" | "inactive"
    linkedTrailId?: string
    linkedTrailName?: string
}

export type CoursePeriodAdmin = {
    id: string
    courseId: string
    number: number
    name: string
    status: "current" | "completed" | "upcoming"
    disciplines: CourseDisciplineAdmin[]
}

export type CourseLinkedContentAdmin = {
    id: string
    courseId: string
    libraryContentId: string
    libraryContentName: string
    type: "trail" | "module"
    linkedAt: string
    linkedBy: string
    disciplineId?: string
    disciplineName?: string
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

export async function getCourseGradesAdmin(courseId: string): Promise<CoursePeriodAdmin[]> {
    const { data: periodsData, error: periodsError } = await supabase
        .from("lxp_course_periods")
        .select("id,course_id,number,name,status")
        .eq("course_id", courseId)
        .order("number", { ascending: true })

    if (periodsError) throw periodsError

    const periodRows = (periodsData ?? []) as Array<{
        id: string
        course_id: string
        number: number
        name: string
        status: "current" | "completed" | "upcoming"
    }>

    if (periodRows.length === 0) return []

    const periodIds = periodRows.map((p) => p.id)
    const { data: disciplinesData, error: disciplinesError } = await supabase
        .from("lxp_course_disciplines")
        .select("id,course_period_id,name,code,workload,credits,professor,status")
        .in("course_period_id", periodIds)
        .order("created_at", { ascending: true })

    if (disciplinesError) throw disciplinesError

    const disciplineRows = (disciplinesData ?? []) as Array<{
        id: string
        course_period_id: string
        name: string
        code: string
        workload: number
        credits: number
        professor: string | null
        status: "active" | "inactive"
    }>

    const disciplineIds = disciplineRows.map((d) => d.id)
    const linksByDisciplineId = new Map<string, { contentId?: string; contentName?: string }>()

    if (disciplineIds.length > 0) {
        const { data: linksData, error: linksError } = await supabase
            .from("lxp_course_library_links")
            .select("course_discipline_id,library_content_id,library_content_name,linked_at")
            .in("course_discipline_id", disciplineIds)
            .order("linked_at", { ascending: false })

        if (linksError) throw linksError

        ;(linksData ?? []).forEach(
            (link: {
                course_discipline_id: string
                library_content_id: string
                library_content_name: string | null
            }) => {
                if (linksByDisciplineId.has(link.course_discipline_id)) return
                linksByDisciplineId.set(link.course_discipline_id, {
                    contentId: link.library_content_id,
                    contentName: link.library_content_name ?? undefined,
                })
            },
        )
    }

    const disciplinesByPeriodId = new Map<string, CourseDisciplineAdmin[]>()
    disciplineRows.forEach((row) => {
        const arr = disciplinesByPeriodId.get(row.course_period_id) ?? []
        const link = linksByDisciplineId.get(row.id)
        arr.push({
            id: row.id,
            periodId: row.course_period_id,
            name: row.name,
            code: row.code,
            workload: row.workload ?? 0,
            credits: row.credits ?? 0,
            professor: row.professor ?? undefined,
            status: row.status ?? "active",
            linkedTrailId: link?.contentId,
            linkedTrailName: link?.contentName,
        })
        disciplinesByPeriodId.set(row.course_period_id, arr)
    })

    return periodRows.map((period) => ({
        id: period.id,
        courseId: period.course_id,
        number: period.number,
        name: period.name,
        status: period.status,
        disciplines: disciplinesByPeriodId.get(period.id) ?? [],
    }))
}

export async function createCoursePeriodAdmin(
    courseId: string,
    data: { name: string; status: "current" | "completed" | "upcoming" },
): Promise<void> {
    const { data: maxNumberData, error: maxNumberError } = await supabase
        .from("lxp_course_periods")
        .select("number")
        .eq("course_id", courseId)
        .order("number", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (maxNumberError) throw maxNumberError

    const nextNumber = (maxNumberData?.number ?? 0) + 1

    const { error } = await supabase.from("lxp_course_periods").insert({
        course_id: courseId,
        name: data.name,
        status: data.status,
        number: nextNumber,
    })

    if (error) throw error
}

export async function updateCoursePeriodAdmin(
    periodId: string,
    data: { name: string; status: "current" | "completed" | "upcoming" },
): Promise<void> {
    const { error } = await supabase
        .from("lxp_course_periods")
        .update({
            name: data.name,
            status: data.status,
            updated_at: new Date().toISOString(),
        })
        .eq("id", periodId)

    if (error) throw error
}

export async function deleteCoursePeriodAdmin(periodId: string): Promise<void> {
    const { error } = await supabase.from("lxp_course_periods").delete().eq("id", periodId)
    if (error) throw error
}

export async function createCourseDisciplineAdmin(
    periodId: string,
    data: { name: string; code: string; workload: number; credits: number; professor?: string },
): Promise<void> {
    const { error } = await supabase.from("lxp_course_disciplines").insert({
        course_period_id: periodId,
        name: data.name,
        code: data.code,
        workload: data.workload,
        credits: data.credits,
        professor: data.professor ?? null,
        status: "active",
    })
    if (error) throw error
}

export async function updateCourseDisciplineAdmin(
    disciplineId: string,
    data: { name: string; code: string; workload: number; credits: number; professor?: string },
): Promise<void> {
    const { error } = await supabase
        .from("lxp_course_disciplines")
        .update({
            name: data.name,
            code: data.code,
            workload: data.workload,
            credits: data.credits,
            professor: data.professor ?? null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", disciplineId)

    if (error) throw error
}

export async function deleteCourseDisciplineAdmin(disciplineId: string): Promise<void> {
    const { error } = await supabase.from("lxp_course_disciplines").delete().eq("id", disciplineId)
    if (error) throw error
}

export async function getCourseLinkedContentAdmin(courseId: string): Promise<CourseLinkedContentAdmin[]> {
    const { data, error } = await supabase
        .from("lxp_course_library_links")
        .select(
            "id,course_discipline_id,library_content_type,library_content_id,library_content_name,linked_at,linked_by,lxp_course_disciplines!inner(id,name,course_period_id,lxp_course_periods!inner(course_id))",
        )
        .eq("lxp_course_disciplines.lxp_course_periods.course_id", courseId)
        .order("linked_at", { ascending: false })

    if (error) throw error

    const rows = (data ?? []) as Array<{
        id: string
        course_discipline_id: string
        library_content_type: "trail" | "module"
        library_content_id: string
        library_content_name: string | null
        linked_at: string
        linked_by: string | null
        lxp_course_disciplines: Array<{
            id: string
            name: string
            course_period_id: string
            lxp_course_periods: Array<{ course_id: string }>
        }>
    }>

    return rows.map((row) => {
        const discipline = row.lxp_course_disciplines?.[0]
        const period = discipline?.lxp_course_periods?.[0]
        return {
            id: row.id,
            courseId: period?.course_id ?? courseId,
            libraryContentId: row.library_content_id,
            libraryContentName: row.library_content_name ?? row.library_content_id,
            type: row.library_content_type,
            linkedAt: row.linked_at,
            linkedBy: row.linked_by ?? "Sistema",
            disciplineId: discipline?.id,
            disciplineName: discipline?.name,
        }
    })
}

export async function linkCourseContentAdmin(
    data: {
        disciplineId: string
        libraryContentType: "trail" | "module"
        libraryContentId: string
        libraryContentName?: string
    },
): Promise<void> {
    const { error } = await supabase.from("lxp_course_library_links").insert({
        course_discipline_id: data.disciplineId,
        library_content_type: data.libraryContentType,
        library_content_id: data.libraryContentId,
        library_content_name: data.libraryContentName ?? null,
        linked_by: null,
    })
    if (error) throw error
}

export async function unlinkCourseContentAdmin(linkId: string): Promise<void> {
    const { error } = await supabase.from("lxp_course_library_links").delete().eq("id", linkId)
    if (error) throw error
}
