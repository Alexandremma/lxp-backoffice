import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const allowedRoles = new Set([
  "admin",
  "coordinator",
  "secretary",
  "professor",
  "tutor",
  "financial",
  "commercial",
])

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(500, {
        code: "INVITE_UNKNOWN_ERROR",
        message: "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente na função.",
      })
    }

    const authorization = req.headers.get("Authorization")
    const token = authorization?.replace("Bearer ", "").trim()
    if (!token) {
      return jsonResponse(401, {
        code: "INVITE_NOT_ALLOWED",
        message: "Token de autenticação ausente.",
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const { data: callerUser, error: callerError } = await supabaseAdmin.auth.getUser(token)
    if (callerError || !callerUser.user) {
      return jsonResponse(401, {
        code: "INVITE_NOT_ALLOWED",
        message: "Sessão inválida para convidar membro.",
      })
    }

    const { data: callerMember, error: callerMemberError } = await supabaseAdmin
      .from("backoffice_team_members")
      .select("role")
      .eq("user_id", callerUser.user.id)
      .maybeSingle()

    if (callerMemberError) {
      return jsonResponse(500, {
        code: "INVITE_UNKNOWN_ERROR",
        message: callerMemberError.message,
      })
    }

    if (!callerMember || callerMember.role !== "admin") {
      return jsonResponse(403, {
        code: "INVITE_NOT_ALLOWED",
        message: "Somente admin pode convidar novos membros.",
      })
    }

    const body = await req.json().catch(() => ({}))
    const rawName = typeof body.name === "string" ? body.name.trim() : ""
    const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const rawRole = typeof body.role === "string" ? body.role.trim() : ""
    const redirectTo = typeof body.redirect_to === "string" ? body.redirect_to.trim() : ""

    if (!rawName || !rawEmail || !allowedRoles.has(rawRole)) {
      return jsonResponse(400, {
        code: "INVITE_BAD_REQUEST",
        message: "Informe nome, e-mail e função válidos.",
      })
    }

    const { data: existingMember, error: existingMemberError } = await supabaseAdmin
      .from("backoffice_team_members")
      .select("id")
      .eq("email", rawEmail)
      .maybeSingle()

    if (existingMemberError) {
      return jsonResponse(500, {
        code: "INVITE_UNKNOWN_ERROR",
        message: existingMemberError.message,
      })
    }

    if (existingMember) {
      return jsonResponse(409, {
        code: "TEAM_MEMBER_EXISTS",
        message: "Já existe membro da equipe com este e-mail.",
      })
    }

    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(rawEmail, {
      data: {
        full_name: rawName,
        role: "admin",
      },
      ...(redirectTo ? { redirectTo } : {}),
    })

    if (inviteError || !invited.user) {
      const msg = inviteError?.message?.toLowerCase() ?? ""
      if (msg.includes("already") || msg.includes("exists")) {
        return jsonResponse(409, {
          code: "AUTH_USER_ALREADY_EXISTS",
          message: "Já existe conta Auth para este e-mail.",
        })
      }
      return jsonResponse(500, {
        code: "INVITE_UNKNOWN_ERROR",
        message: inviteError?.message ?? "Falha ao convidar usuário no Auth.",
      })
    }

    const { data: member, error: memberError } = await supabaseAdmin
      .from("backoffice_team_members")
      .insert({
        user_id: invited.user.id,
        name: rawName,
        email: rawEmail,
        role: rawRole,
      })
      .select("id,user_id,name,email,role,created_at,updated_at")
      .single()

    if (memberError) {
      return jsonResponse(500, {
        code: "INVITE_UNKNOWN_ERROR",
        message: memberError.message,
      })
    }

    return jsonResponse(200, {
      member,
      invitation_sent: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha inesperada na função."
    return jsonResponse(500, {
      code: "INVITE_UNKNOWN_ERROR",
      message,
    })
  }
})
