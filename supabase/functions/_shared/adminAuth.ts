import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2.49.8"
import { jsonResponse } from "./cors.ts"

export type AdminCaller = {
  user: User
  token: string
  role: string
  supabaseAdmin: SupabaseClient
}

export async function assertAdminCaller(
  req: Request,
  options?: { roles?: string[] },
): Promise<AdminCaller | Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, {
      code: "SMTP_CONFIG_ERROR",
      message: "Configuração do servidor incompleta.",
    })
  }

  const authorization = req.headers.get("Authorization")
  const token = authorization?.replace("Bearer ", "").trim()
  if (!token) {
    return jsonResponse(401, {
      code: "SMTP_NOT_ALLOWED",
      message: "Sessão ausente.",
    })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  const { data: callerUser, error: callerError } = await supabaseAdmin.auth.getUser(token)
  if (callerError || !callerUser.user) {
    return jsonResponse(401, {
      code: "SMTP_NOT_ALLOWED",
      message: "Sessão inválida.",
    })
  }

  const { data: callerMember, error: callerMemberError } = await supabaseAdmin
    .from("backoffice_team_members")
    .select("role")
    .eq("user_id", callerUser.user.id)
    .maybeSingle()

  if (callerMemberError) {
    return jsonResponse(500, {
      code: "SMTP_UNKNOWN_ERROR",
      message: callerMemberError.message,
    })
  }

  const allowedRoles = options?.roles ?? ["admin"]
  const callerRole = typeof callerMember?.role === "string" ? callerMember.role.trim() : ""
  if (!callerMember || !allowedRoles.includes(callerRole)) {
    return jsonResponse(403, {
      code: "SMTP_NOT_ALLOWED",
      message: "Somente administrador pode alterar o SMTP.",
    })
  }

  return {
    user: callerUser.user,
    token,
    role: callerRole,
    supabaseAdmin,
  }
}
