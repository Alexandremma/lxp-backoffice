import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

function getAuthErrorMessageFromHash(): string | null {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const errorCode = params.get("error_code");
  if (!errorCode) return null;

  if (errorCode === "otp_expired") {
    return "Este link expirou ou já foi usado. Solicite um novo convite ou redefinição de senha.";
  }

  const description = params.get("error_description");
  if (description) return decodeURIComponent(description.replace(/\+/g, " "));
  return "Não foi possível validar o link de acesso.";
}

export default function AdminSetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const hashError = useMemo(() => getAuthErrorMessageFromHash(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError("A senha precisa ter no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError("Não foi possível definir a senha. Solicite um novo convite e tente novamente.");
      return;
    }

    setLoading(false);
    setSuccess("Senha definida com sucesso. Faça login no Backoffice.");
    window.history.replaceState({}, document.title, window.location.pathname);
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Definir senha de acesso</CardTitle>
          <CardDescription>Primeiro acesso ao Backoffice</CardDescription>
        </CardHeader>
        <CardContent>
          {hashError && (
            <p className="mb-4 text-sm text-destructive" role="alert">
              {hashError}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-success" role="status">
                {success}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Salvar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
