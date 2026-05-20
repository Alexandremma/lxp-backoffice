import { fetchAliceDisciplineCatalog, isAliceConfigured } from "@/services/aliceService"

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

type EadstockDisciplineListItem = {
  id: number | string
  hash?: string | null
  nome?: string | null
  ementa?: string | null
  carga_horaria?: number | string | null
  autores_concat?: string | null
  total_unidades?: number | null
  disciplina_situacao_id?: number | null
  ativo?: number | null
}

type EadstockListResponse = {
  data?: EadstockDisciplineListItem[]
  total?: number
}

function normalizeBaseUrl(baseUrl?: string): string {
  if (!baseUrl) return ""
  if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) return baseUrl
  return `https://${baseUrl}`
}

function isEadstockConfigured(): boolean {
  return Boolean(normalizeBaseUrl(import.meta.env.VITE_EADSTOCK_BASE_URL))
}

export function getLibraryCatalogStatus(): {
  alice: boolean
  eadstock: boolean
} {
  return { alice: isAliceConfigured(), eadstock: isEadstockConfigured() }
}

export function getLibraryDisciplineUrl(disciplineId: string): string | undefined {
  const baseUrl = normalizeBaseUrl(import.meta.env.VITE_EADSTOCK_BASE_URL)
  if (!baseUrl) return undefined
  return `${baseUrl}/disciplinas/get/${disciplineId}`
}

function toDurationLabel(value: EadstockDisciplineListItem["carga_horaria"]): string | undefined {
  if (value == null || value === "") return undefined
  return `${value}h`
}

function buildEadstockHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const apiKey = import.meta.env.VITE_EADSTOCK_API_KEY
  const apiSecret = import.meta.env.VITE_EADSTOCK_API_SECRET
  if (apiKey) headers["X-API-Key"] = apiKey
  if (apiSecret) headers["X-API-Secret"] = apiSecret
  return headers
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
    description: "Catálogo Alice (EaDStock) — unidades disponíveis via /api/rents.",
    externalUrl: undefined,
    tags: ["Alice", "EaDStock"],
    duration: undefined,
    lessonsCount: row.rentsCount > 0 ? row.rentsCount : undefined,
    catalogSource: "alice" as const,
  }))

  if (q.length > 0 && q.length < 2) {
    const needle = q.toLowerCase()
    mapped = mapped.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) || item.id.includes(needle),
    )
  }

  return {
    items: mapped,
    total: q.length > 0 && q.length < 2 ? mapped.length : total,
    catalogSource: "alice",
  }
}

async function getLibraryContentFromEadstock(params: SearchLibraryParams): Promise<SearchLibraryResponse> {
  const baseUrl = normalizeBaseUrl(import.meta.env.VITE_EADSTOCK_BASE_URL)
  if (!baseUrl) {
    return { items: [], total: 0, catalogSource: "none" }
  }

  const query = new URLSearchParams()
  query.set("page", String(params.page ?? 1))
  query.set("pageSize", String(params.pageSize ?? 20))

  if (params.q?.trim()) {
    query.set("disciplina", params.q.trim())
  }

  const url = `${baseUrl}/scout/disciplinas/list?${query.toString()}`
  const response = await fetch(url, {
    method: "GET",
    headers: buildEadstockHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Falha ao consultar biblioteca Eadstock (${response.status}).`)
  }

  const payload = (await response.json()) as EadstockListResponse
  const rows = payload.data ?? []

  const filtered = rows.filter((row) => {
    const hasAllowedStatus = row.disciplina_situacao_id == null || row.disciplina_situacao_id === 3
    const isActive = row.ativo == null || row.ativo === 1
    return hasAllowedStatus && isActive
  })

  return {
    items: filtered.map((row) => ({
      id: String(row.id),
      name: row.nome?.trim() || row.hash?.trim() || `Disciplina ${row.id}`,
      type: "discipline",
      description: row.ementa ?? undefined,
      externalUrl: getLibraryDisciplineUrl(String(row.id)),
      tags: row.autores_concat ? row.autores_concat.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      duration: toDurationLabel(row.carga_horaria),
      lessonsCount: row.total_unidades ?? undefined,
      catalogSource: "eadstock",
    })),
    total: payload.total ?? filtered.length,
    catalogSource: "eadstock",
  }
}

/** Catálogo para o modal "Vincular disciplina": Alice (prioridade) → Eadstock. */
export async function getLibraryContent(params: SearchLibraryParams): Promise<SearchLibraryResponse> {
  if (isAliceConfigured()) {
    try {
      return await getLibraryContentFromAlice(params)
    } catch (err) {
      console.warn("[libraryAdapter] Alice catalog failed:", err)
      if (isEadstockConfigured()) {
        return getLibraryContentFromEadstock(params)
      }
      throw err
    }
  }

  if (isEadstockConfigured()) {
    return getLibraryContentFromEadstock(params)
  }

  return {
    items: [],
    total: 0,
    catalogSource: "none",
  }
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
