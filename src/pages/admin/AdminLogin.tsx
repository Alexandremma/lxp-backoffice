import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_BACKOFFICE_SET_PASSWORD_URL = "https://lxp-backoffice.vercel.app/admin/definir-senha";
const backofficeSetPasswordUrl = (
  import.meta.env.VITE_BACKOFFICE_SET_PASSWORD_URL ?? DEFAULT_BACKOFFICE_SET_PASSWORD_URL
).trim();

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authView, setAuthView] = useState<"login" | "forgot">("login");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const errorCode = params.get("error_code");
    if (!errorCode) return;

    if (errorCode === "otp_expired") {
      setError("Este link expirou ou já foi utilizado. Solicite um novo convite ou redefinição de senha.");
    } else {
      const description = params.get("error_description");
      setError(
        description
          ? decodeURIComponent(description.replace(/\+/g, " "))
          : "Não foi possível concluir o acesso.",
      );
    }

    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { session },
      error: signInError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !session) {
      setError("Credenciais inválidas. Verifique seu email e senha.");
      setLoading(false);
      return;
    }

    const currentUser = session.user;

    // Garante que exista um registro em backoffice_team_members para o usuário autenticado.
    // Segue a mesma ideia do LXP Alunos: tenta criar, mas não bloqueia o login se der erro.
    try {
      const { data: existingMember, error: memberError } = await supabase
        .from("backoffice_team_members")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (memberError) {
        console.warn("[AdminLogin] Erro ao carregar membro da equipe:", memberError.message);
      } else if (!existingMember) {
        const { error: insertError } = await supabase.from("backoffice_team_members").insert({
          user_id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.full_name ?? currentUser.email,
          role: "admin",
        });

        if (insertError) {
          console.warn("[AdminLogin] Erro ao criar membro da equipe:", insertError.message);
        }
      }
    } catch (e) {
      console.warn("[AdminLogin] Erro inesperado ao garantir membro da equipe:", e);
    }

    setLoading(false);
    navigate("/", { replace: true });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Informe o e-mail cadastrado.");
      return;
    }
    setForgotLoading(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: backofficeSetPasswordUrl,
    });
    setForgotLoading(false);
    if (resetErr) {
      setError("Não foi possível enviar o e-mail. Tente novamente ou fale com o suporte.");
      return;
    }
    setForgotMessage(
      "Se existir uma conta com este e-mail, você receberá um link para redefinir a senha em instantes.",
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Acesso Administrativo</CardTitle>
          <CardDescription>Entre com suas credenciais de administrador</CardDescription>
        </CardHeader>
        <CardContent>
          {authView === "login" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@instituicao.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => {
                      setError(null);
                      setForgotMessage(null);
                      setAuthView("forgot");
                    }}
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                O acesso ao backoffice é restrito à equipe da instituição.
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Informe o e-mail da sua conta institucional. Enviaremos um link para criar uma nova senha.
              </p>
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="admin@instituicao.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              {forgotMessage && (
                <p className="text-sm text-muted-foreground" role="status">
                  {forgotMessage}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={forgotLoading}>
                {forgotLoading ? "Enviando..." : "Enviar link de redefinição"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setError(null);
                  setForgotMessage(null);
                  setAuthView("login");
                }}
              >
                Voltar ao login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

