/**
 * API Alice (EaDStock) — catálogo via GET /api/rents (backoffice).
 * @see INTEGRACAO_ALICE_EADSTOCK.md
 */

export type AliceDisciplineRents = {
  disciplineId: number
  disciplineName: string
  rentsCount: number
}

type AliceRentRaw = {
  id?: number
  hash?: string
  url?: string
  url_completa?: string
  nome_unidade?: string
}

type AliceRentsResponse = {
  status?: number
  data?: Array<{
    discipline?: { id?: number; nome?: string }
    rents?: AliceRentRaw[]
  }>
  pagination?: { total?: number }
}

function normalizeBaseUrl(baseUrl?: string): string {
  if (!baseUrl) return ""
  if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) return baseUrl.replace(/\/$/, "")
  return `https://${baseUrl.replace(/\/$/, "")}`
}

export function isAliceConfigured(): boolean {
  const key = import.meta.env.VITE_ALICE_API_KEY?.trim()
  const secret = import.meta.env.VITE_ALICE_API_SECRET?.trim()
  return Boolean(key && secret)
}

function buildAliceApiHeaders(): HeadersInit {
  const apiKey = import.meta.env.VITE_ALICE_API_KEY?.trim()
  const secret = import.meta.env.VITE_ALICE_API_SECRET?.trim()
  if (!apiKey || !secret) return { Accept: "application/json" }
  const basic = btoa(`${apiKey}:${secret}`)
  return {
    Accept: "application/json",
    Authorization: `Basic ${basic}`,
    "X-Api-Key": apiKey,
    "X-Secret-Key": secret,
  }
}

export async function fetchAliceDisciplineCatalog(params?: {
  page?: number
  limit?: number
  search?: string
}): Promise<{ items: AliceDisciplineRents[]; total: number }> {
  const base = normalizeBaseUrl(import.meta.env.VITE_ALICE_BASE_URL ?? "https://alice.eadstock.com.br")
  if (!isAliceConfigured()) return { items: [], total: 0 }

  const qs = new URLSearchParams()
  qs.set("page", String(params?.page ?? 1))
  qs.set("limit", String(params?.limit ?? 50))
  const search = params?.search?.trim()
  if (search && search.length >= 2) qs.set("search", search)

  const response = await fetch(`${base}/api/rents?${qs}`, {
    method: "GET",
    headers: buildAliceApiHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Alice /api/rents falhou (${response.status}). Verifique VITE_ALICE_* no deploy.`)
  }

  const payload = (await response.json()) as AliceRentsResponse
  const groups = payload.data ?? []

  const items = groups
    .filter((g) => g.discipline?.id != null)
    .map((g) => ({
      disciplineId: g.discipline!.id!,
      disciplineName: g.discipline?.nome?.trim() ?? `Disciplina ${g.discipline?.id}`,
      rentsCount: (g.rents ?? []).length,
    }))

  return {
    items,
    total: payload.pagination?.total ?? items.length,
  }
}
