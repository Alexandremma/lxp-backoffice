import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

async function isAdminUser(supabaseAdmin: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("backoffice_team_members")
    .select("id,role")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error
  return !!data && data.role === "admin"
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(500, {
        code: "UNKNOWN_ERROR",
        message: "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente na função.",
      })
    }

    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "").trim()
    if (!token) {
      return jsonResponse(401, { code: "NOT_AUTHORIZED", message: "Token ausente." })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const { data: caller, error: callerErr } = await supabaseAdmin.auth.getUser(token)
    if (callerErr || !caller.user) {
      return jsonResponse(401, { code: "NOT_AUTHORIZED", message: "Sessão inválida." })
    }

    const adminAllowed = await isAdminUser(supabaseAdmin, caller.user.id)
    if (!adminAllowed) {
      return jsonResponse(403, { code: "NOT_AUTHORIZED", message: "Apenas admin pode operar alunos." })
    }

    const body = await req.json().catch(() => ({}))
    const action = typeof body.action === "string" ? body.action : ""

    if (action === "create") {
      const name = typeof body.name === "string" ? body.name.trim() : ""
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
      const redirectTo = typeof body.redirect_to === "string" ? body.redirect_to.trim() : ""
      const courseIds = Array.isArray(body.course_ids)
        ? body.course_ids.filter((id: unknown) => typeof id === "string")
        : []
      const status = typeof body.status === "string" ? body.status : "active"

      if (!name || !email || courseIds.length === 0) {
        return jsonResponse(400, { code: "INVALID_PAYLOAD", message: "Dados inválidos para criar aluno." })
      }

      const { data: existing, error: existingErr } = await supabaseAdmin
        .from("lxp_profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle()
      if (existingErr) return jsonResponse(500, { code: "UNKNOWN_ERROR", message: existingErr.message })
      if (existing) return jsonResponse(409, { code: "STUDENT_ALREADY_EXISTS", message: "Aluno já cadastrado." })

      const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name, role: "student" },
        ...(redirectTo ? { redirectTo } : {}),
      })
      if (inviteErr || !invited.user) {
        return jsonResponse(500, { code: "UNKNOWN_ERROR", message: inviteErr?.message ?? "Falha ao criar usuário no Auth." })
      }

      const { data: profile, error: profileErr } = await supabaseAdmin
        .from("lxp_profiles")
        .insert({
          user_id: invited.user.id,
          name,
          email,
          role: "student",
        })
        .select("id")
        .single()
      if (profileErr || !profile) {
        return jsonResponse(500, { code: "UNKNOWN_ERROR", message: profileErr?.message ?? "Falha ao criar perfil." })
      }

      const enrollmentStatus = status === "inactive" ? "inactive" : status === "blocked" ? "blocked" : "active"
      const { error: enrollErr } = await supabaseAdmin.from("lxp_enrollments").insert(
        courseIds.map((courseId: string) => ({
          student_profile_id: profile.id,
          course_id: courseId,
          status: enrollmentStatus,
        })),
      )
      if (enrollErr) {
        return jsonResponse(500, { code: "UNKNOWN_ERROR", message: enrollErr.message })
      }

      if (status === "blocked") {
        await supabaseAdmin.auth.admin.updateUserById(invited.user.id, { ban_duration: "876000h" })
      }

      return jsonResponse(200, { profile_id: profile.id })
    }

    if (action === "set_access") {
      const profileId = typeof body.profile_id === "string" ? body.profile_id : ""
      const statusFromBody = typeof body.status === "string" ? body.status : ""
      const status =
        statusFromBody === "active" || statusFromBody === "inactive" || statusFromBody === "blocked"
          ? statusFromBody
          : body.blocked
            ? "blocked"
            : "active"
      if (!profileId) {
        return jsonResponse(400, { code: "INVALID_PAYLOAD", message: "profile_id obrigatório." })
      }

      const { data: profile, error: profileErr } = await supabaseAdmin
        .from("lxp_profiles")
        .select("id,user_id")
        .eq("id", profileId)
        .eq("role", "student")
        .maybeSingle()
      if (profileErr) return jsonResponse(500, { code: "UNKNOWN_ERROR", message: profileErr.message })
      if (!profile) return jsonResponse(404, { code: "STUDENT_NOT_FOUND", message: "Aluno não encontrado." })

      const { error: enrErr } = await supabaseAdmin
        .from("lxp_enrollments")
        .update({ status })
        .eq("student_profile_id", profileId)
      if (enrErr) return jsonResponse(500, { code: "UNKNOWN_ERROR", message: enrErr.message })

      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(profile.user_id, {
        ban_duration: status === "blocked" ? "876000h" : "none",
      })
      if (authErr) return jsonResponse(500, { code: "UNKNOWN_ERROR", message: authErr.message })

      return jsonResponse(200, { ok: true })
    }

    if (action === "delete") {
      const profileId = typeof body.profile_id === "string" ? body.profile_id : ""
      if (!profileId) {
        return jsonResponse(400, { code: "INVALID_PAYLOAD", message: "profile_id obrigatório." })
      }

      const { data: profile, error: profileErr } = await supabaseAdmin
        .from("lxp_profiles")
        .select("id,user_id")
        .eq("id", profileId)
        .eq("role", "student")
        .maybeSingle()
      if (profileErr) return jsonResponse(500, { code: "UNKNOWN_ERROR", message: profileErr.message })
      if (!profile) return jsonResponse(404, { code: "STUDENT_NOT_FOUND", message: "Aluno não encontrado." })

      const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(profile.user_id)
      if (deleteErr) return jsonResponse(500, { code: "UNKNOWN_ERROR", message: deleteErr.message })

      return jsonResponse(200, { ok: true })
    }

    return jsonResponse(400, { code: "INVALID_PAYLOAD", message: "Ação inválida." })
  } catch (error) {
    return jsonResponse(500, {
      code: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Erro inesperado.",
    })
  }
})
