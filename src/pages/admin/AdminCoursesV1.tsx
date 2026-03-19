import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

type CourseRow = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "draft" | "archived";
  created_at: string;
};

export default function AdminCoursesV1() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseRow[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CourseRow["status"]>("active");
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("lxp_courses")
      .select("id,name,description,status,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setCourses((data ?? []) as CourseRow[]);
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        await fetchCourses();
      } catch (e) {
        toast.error("Erro ao carregar cursos");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const statusBadgeVariant = (s: CourseRow["status"]) => {
    switch (s) {
      case "active":
        return "success";
      case "draft":
        return "warning";
      case "archived":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Informe o nome do curso");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("lxp_courses").insert({
        name: trimmedName,
        description: description.trim() || null,
        status,
      });

      if (error) throw error;

      setName("");
      setDescription("");
      setStatus("active");
      await fetchCourses();
      toast.success("Curso criado com sucesso");
    } catch {
      toast.error("Erro ao criar curso");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <PageHeader title="Cursos" description="CRUD mínimo para a entrega da Semana 1" >
        <Button onClick={() => navigate("/admin/matriculas")} >
          <Plus className="h-4 w-4 mr-2" />
          Matricular Aluno
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course-name">Nome</Label>
              <Input
                id="course-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Administração de Empresas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-description">Descrição</Label>
              <Textarea
                id="course-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do curso"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as CourseRow["status"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={submitting}>
              {submitting ? "Criando..." : "Criar curso"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de cursos</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">
                  {courses.filter((c) => c.status === "active").length}
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum curso cadastrado ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          {c.description ? (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {c.description}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Sem descrição</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(c.status)}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

