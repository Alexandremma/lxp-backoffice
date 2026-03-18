import { useState } from "react";
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

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
              <Label htmlFor="password">Senha</Label>
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
        </CardContent>
      </Card>
    </div>
  );
}

