/**
 * Proxy do Tutor IA (MAIA) para o lxp-alunos.
 *
 * POST  — stream SSE: { question, rent_hash, conversation_id? }
 * GET   — histórico:  ?conversation_id=&limit=
 *
 * Secrets: MAIA_API_KEY, MAIA_BASE_URL?, MAIA_TENANT_ID?
 * @see docs-central/tutor-ia/dfl-integration.md
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8"
import { corsHeaders, jsonResponse } from "../_shared/cors.ts"

const DEFAULT_MAIA_BASE_URL = "https://apimaia.eadstock.com.br"
const DEFAULT_TENANT_ID = "lxp_educacional_tutor_dev_fellowship_global"

const sseCorsHeaders: Record<string, string> = {
  ...corsHeaders,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, accept",
}

async function requireUser(req: Request): Promise<{ token: string } | Response> {
  const authorization = req.headers.get("Authorization")
  const token = authorization?.replace(/^Bearer\s+/i, "").trim()
  if (!token) {
    return jsonResponse(401, {
      code: "TUTOR_UNAUTHORIZED",
      message: "Sessão ausente.",
    })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  if (!supabaseUrl || !anonKey) {
    return jsonResponse(500, {
      code: "TUTOR_CONFIG_ERROR",
      message: "Configuração do servidor incompleta.",
    })
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return jsonResponse(401, {
      code: "TUTOR_UNAUTHORIZED",
      message: "Sessão inválida.",
    })
  }

  return { token }
}

function maiaConfig():
  | { apiKey: string; baseUrl: string; tenantId: string }
  | Response {
  const apiKey = Deno.env.get("MAIA_API_KEY")?.trim()
  if (!apiKey) {
    return jsonResponse(500, {
      code: "TUTOR_CONFIG_ERROR",
      message: "MAIA_API_KEY não configurada.",
    })
  }
  const baseUrl = (
    Deno.env.get("MAIA_BASE_URL")?.trim() || DEFAULT_MAIA_BASE_URL
  ).replace(/\/$/, "")
  const tenantId =
    Deno.env.get("MAIA_TENANT_ID")?.trim() || DEFAULT_TENANT_ID
  return { apiKey, baseUrl, tenantId }
}

function maiaHeaders(apiKey: string, tenantId: string, accept: string) {
  return {
    "X-Api-Key": apiKey,
    "X-Tenant-Id": tenantId,
    "X-Tenant-Name": "Dev Fellowship LXP",
    Accept: accept,
    "Content-Type": "application/json",
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: sseCorsHeaders })
  }

  const auth = await requireUser(req)
  if (auth instanceof Response) return auth

  const config = maiaConfig()
  if (config instanceof Response) return config

  try {
    if (req.method === "GET") {
      const url = new URL(req.url)
      const conversationId = url.searchParams.get("conversation_id")?.trim()
      if (!conversationId) {
        return jsonResponse(400, {
          code: "TUTOR_BAD_REQUEST",
          message: "Informe conversation_id.",
        })
      }
      const limitRaw = Number(url.searchParams.get("limit") ?? 40)
      const limit = Number.isFinite(limitRaw)
        ? Math.min(Math.max(Math.floor(limitRaw), 1), 200)
        : 40

      const upstream = await fetch(
        `${config.baseUrl}/conversations/${encodeURIComponent(conversationId)}?limit=${limit}`,
        {
          method: "GET",
          headers: maiaHeaders(config.apiKey, config.tenantId, "application/json"),
        },
      )

      const text = await upstream.text()
      return new Response(text, {
        status: upstream.status,
        headers: {
          ...sseCorsHeaders,
          "Content-Type":
            upstream.headers.get("Content-Type") ?? "application/json",
        },
      })
    }

    if (req.method !== "POST") {
      return jsonResponse(405, {
        code: "TUTOR_BAD_REQUEST",
        message: "Método não permitido.",
      })
    }

    const body = (await req.json().catch(() => ({}))) as {
      question?: string
      rent_hash?: string
      conversation_id?: string
    }

    const question = typeof body.question === "string" ? body.question.trim() : ""
    if (!question || question.length > 4000) {
      return jsonResponse(400, {
        code: "TUTOR_BAD_REQUEST",
        message: "Informe uma pergunta válida (1–4000 caracteres).",
      })
    }

    const rentHash =
      typeof body.rent_hash === "string" ? body.rent_hash.trim() : ""
    if (!rentHash) {
      return jsonResponse(400, {
        code: "TUTOR_BAD_REQUEST",
        message: "rent_hash é obrigatório para o tutor desta aula.",
      })
    }

    const conversationId =
      typeof body.conversation_id === "string"
        ? body.conversation_id.trim()
        : ""

    const payload: Record<string, unknown> = {
      question,
      rent_hash: rentHash,
    }
    if (conversationId) payload.conversation_id = conversationId

    const upstream = await fetch(
      `${config.baseUrl}/chat/dev_fellowship/stream`,
      {
        method: "POST",
        headers: maiaHeaders(
          config.apiKey,
          config.tenantId,
          "text/event-stream",
        ),
        body: JSON.stringify(payload),
      },
    )

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => "")
      return jsonResponse(502, {
        code: "TUTOR_UPSTREAM_ERROR",
        message: `MAIA respondeu ${upstream.status}.`,
        detail: errText.slice(0, 500),
      })
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...sseCorsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[ai-tutor-chat]", error)
    return jsonResponse(500, {
      code: "TUTOR_UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Erro inesperado.",
    })
  }
})
