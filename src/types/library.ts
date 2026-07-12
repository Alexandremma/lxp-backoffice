export type LibraryContentType = "discipline"

export type LibraryItem = {
  id: string
  name: string
  type: LibraryContentType
  description?: string
  externalUrl?: string
  tags?: string[]
  duration?: string
  modulesCount?: number
  lessonsCount?: number
  /** Origem do catálogo exibido no modal de vínculo */
  catalogSource?: "alice" | "eadstock"
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
  catalogSource?: "alice" | "eadstock" | "none"
}
