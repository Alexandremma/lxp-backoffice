export type CourseLinkedContentAdmin = {
    id: string
    courseId: string
    libraryContentId: string
    libraryContentName: string
    externalUrl?: string
    type: "discipline"
    linkedAt: string
    linkedBy: string
    disciplineId?: string
    disciplineName?: string
}
