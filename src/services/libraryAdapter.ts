import { fetchAliceDisciplineCatalog, isAliceConfigured } from "@/services/aliceService"
import type {
  ModuleDetail,
  SearchLibraryParams,
  SearchLibraryResponse,
  TrailDetail,
} from "@/types/library"

export type {
  LibraryContentType,
  LibraryItem,
  ModuleDetail,
  SearchLibraryParams,
  SearchLibraryResponse,
  TrailDetail,
} from "@/types/library"

export function getLibraryCatalogStatus(): { alice: boolean } {
  return { alice: isAliceConfigured() }
}

async function getLibraryContentFromAlice(params: SearchLibraryParams): Promise<SearchLibraryResponse> {
  const q = params.q?.trim() ?? ""
  const { items: groups, total } = await fetchAliceDisciplineCatalog({
    page: params.page ?? 1,
    limit: params.pageSize ?? 50,
    search: q.length >= 2 ? q : undefined,
  })

  let mapped = groups.map((row) => ({
    id: String(row.disciplineId),
    name: row.disciplineName,
    type: "discipline" as const,
    description: "Catálogo Alice — unidades disponíveis via /api/rents.",
    externalUrl: undefined,
    tags: ["Alice"],
    duration: undefined,
    lessonsCount: row.rentsCount > 0 ? row.rentsCount : undefined,
    catalogSource: "alice" as const,
  }))

  if (q.length > 0 && q.length < 2) {
    const needle = q.toLowerCase()
    mapped = mapped.filter(
      (item) => item.name.toLowerCase().includes(needle) || item.id.includes(needle),
    )
  }

  return {
    items: mapped,
    total: q.length > 0 && q.length < 2 ? mapped.length : total,
    catalogSource: "alice",
  }
}

/** Catálogo para o modal "Vincular disciplina" (Alice). */
export async function getLibraryContent(params: SearchLibraryParams): Promise<SearchLibraryResponse> {
  if (!isAliceConfigured()) {
    return { items: [], total: 0, catalogSource: "none" }
  }
  return getLibraryContentFromAlice(params)
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
