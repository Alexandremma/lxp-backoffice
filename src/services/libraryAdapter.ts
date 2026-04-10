// TODO: Integrar autenticação final da API externa (Keycloak/API key + SHA256) após validacao final com o cliente.
// TODO: Confirmar contrato final do endpoint que traz alice_url por aula (rents/list) para o fluxo de iframe.
export type LibraryContentType = "discipline"

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

function toDurationLabel(value: EadstockDisciplineListItem["carga_horaria"]): string | undefined {
  if (value == null || value === "") return undefined
  return `${value}h`
}

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const apiKey = import.meta.env.VITE_EADSTOCK_API_KEY
  const apiSecret = import.meta.env.VITE_EADSTOCK_API_SECRET

  // TODO: Confirmar se X-API-Secret deve ser enviado bruto ou com hash SHA256.
  if (apiKey) headers["X-API-Key"] = apiKey
  if (apiSecret) headers["X-API-Secret"] = apiSecret

  return headers
}

export async function getLibraryContent(params: SearchLibraryParams): Promise<SearchLibraryResponse> {
  const baseUrl = normalizeBaseUrl(import.meta.env.VITE_EADSTOCK_BASE_URL)
  if (!baseUrl) {
    // TODO: Definir VITE_EADSTOCK_BASE_URL por ambiente (stage/dev/prod) para habilitar catalogo real.
    return { items: [], total: 0 }
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
    headers: buildHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Falha ao consultar biblioteca externa (${response.status}).`)
  }

  const payload = (await response.json()) as EadstockListResponse
  const rows = payload.data ?? []

  const filtered = rows.filter((row) => {
    // TODO: Confirmar quais valores de disciplina_situacao_id representam "publicado/visivel para aluno".
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
      tags: row.autores_concat ? row.autores_concat.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      duration: toDurationLabel(row.carga_horaria),
      lessonsCount: row.total_unidades ?? undefined,
    })),
    total: payload.total ?? filtered.length,
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

