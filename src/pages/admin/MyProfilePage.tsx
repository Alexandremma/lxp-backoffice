import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Mail, Pencil, Save, User, X } from "lucide-react";
import { toast } from "sonner";
import { SkeletonCard } from "@/components/ui/skeleton"
import { LoadingSpinner } from "@/components/states/LoadingSpinner";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TEAM_ROLE_LABELS } from "@/consts/teamRoles";
import { useBackofficeMember } from "@/hooks/queries/useBackofficeMember";
import { useUpdateOwnTeamMemberProfile } from "@/hooks/mutations/useUpdateOwnTeamMemberProfile";

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email(),
  department: z.string().max(120, "Departamento muito longo").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function formatDateBr(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

function initialsFromDisplay(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function memberFormValues(member: NonNullable<ReturnType<typeof useBackofficeMember>["data"]>): ProfileFormValues {
  return {
    name: member.name?.trim() || "",
    email: member.email?.trim() || "",
    department: member.department?.trim() || "",
  };
}

const MyProfilePage = () => {
  const { data: member, isLoading, isError, error } = useBackofficeMember();
  const updateProfile = useUpdateOwnTeamMemberProfile();
  const [isEditing, setIsEditing] = useState(false);

  const roleLabel = useMemo(
    () => (member ? TEAM_ROLE_LABELS[member.role] : ""),
    [member],
  );

  const avatarInitials = useMemo(() => {
    if (!member) return "?";
    const label = member.name?.trim() || member.email || "Membro";
    return initialsFromDisplay(label);
  }, [member]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "", department: "" },
  });

  const fieldsDisabled = !isEditing || updateProfile.isPending;

  useEffect(() => {
    if (member) {
      form.reset(memberFormValues(member));
    }
  }, [member, form]);

  const handleStartEdit = () => setIsEditing(true);

  const handleCancelEdit = () => {
    if (member) {
      form.reset(memberFormValues(member));
    }
    setIsEditing(false);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync({
        name: values.name,
        department: values.department?.trim() || null,
      });
      toast.success("Perfil atualizado.");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar seu perfil.");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <SkeletonCard className="max-w-2xl" />
      </AdminLayout>
    );
  }

  if (isError || !member) {
    return (
      <AdminLayout>
        <PageHeader title="Meu perfil" description="Informações do seu acesso ao backoffice." />
        <Card className="max-w-2xl">
          <CardContent className="py-8 text-sm text-muted-foreground">
            {(error as Error)?.message ?? "Não foi possível carregar seu perfil."}
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Meu perfil"
        description="Visualize e edite suas informações de cadastro."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className="h-16 w-16 shrink-0">
                <AvatarImage src="/placeholder.svg" alt={member.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardTitle>{member.name}</CardTitle>
                <CardDescription>{member.email || "—"}</CardDescription>
                {roleLabel ? (
                  <Badge variant="secondary" className="mt-2">
                    {roleLabel}
                  </Badge>
                ) : null}
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-right shrink-0">
              Membro da equipe desde {formatDateBr(member.createdAt)}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Nome completo
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" disabled={fieldsDisabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      E-mail
                    </FormLabel>
                    <FormControl>
                      <Input type="email" disabled {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Campo somente leitura.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Departamento
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Pedagógico" disabled={fieldsDisabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <div className="flex justify-end gap-2 border-t border-border pt-6 mt-6">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={updateProfile.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar
                </Button>
              </>
            ) : (
              <Button type="button" onClick={handleStartEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default MyProfilePage;
