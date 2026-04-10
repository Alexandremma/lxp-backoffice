// Adapter stub for external library (trails/modules).
// Pending: replace with real HTTP integration once the external API schema/endpoints are available.
export type LibraryContentType = "trail" | "module"

export type LibraryItem = {
  id: string
  name: string
  type: LibraryContentType
  description?: string
  tags?: string[]
  duration?: string
  modulesCount?: number
  lessonsCount?: number
}

export type TrailDetail = {
  id: string
  name: string
  description?: string
  tags?: string[]
  duration?: string
  modules: Array<{
    id: string
    name: string
    lessonsCount?: number
  }>
}

export type ModuleDetail = {
  id: string
  name: string
  description?: string
  duration?: string
  lessons: Array<{
    id: string
    name: string
    duration?: string
  }>
}

export type SearchLibraryParams = {
  q?: string
  type?: LibraryContentType | "all"
  page?: number
  pageSize?: number
}

export type SearchLibraryResponse = {
  items: LibraryItem[]
  total: number
}

// Stub implementations: replace with real HTTP calls when external schema is available.
export async function getLibraryContent(params: SearchLibraryParams): Promise<SearchLibraryResponse> {
  // For now, return empty results to enable UI wiring without mocks.
  return { items: [], total: 0 }
}

export async function getTrailDetail(id: string): Promise<TrailDetail> {
  return {
    id,
    name: "Trail",
    description: undefined,
    tags: [],
    duration: undefined,
    modules: [],
  }
}

export async function getModuleDetail(id: string): Promise<ModuleDetail> {
  return {
    id,
    name: "Module",
    description: undefined,
    duration: undefined,
    lessons: [],
  }
}

