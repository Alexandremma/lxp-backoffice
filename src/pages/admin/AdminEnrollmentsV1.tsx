import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
};

type CourseRow = {
  id: string;
  name: string;
};

type EnrollmentRow = {
  id: string;
  student_profile_id: string;
  course_id: string;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  studentName?: string;
  courseName?: string;
};

export default function AdminEnrollmentsV1() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [students, setStudents] = useState<ProfileRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);

  const [studentId, setStudentId] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");

  const [search, setSearch] = useState("");

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("lxp_profiles")
      .select("id,name,email")
      .eq("role", "student")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setStudents((data ?? []) as ProfileRow[]);
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("lxp_courses")
      .select("id,name")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setCourses((data ?? []) as CourseRow[]);
  };

  const fetchEnrollments = async () => {
    // Query simples: traz ids e depois buscamos nomes em 2 mapas locais
    const { data: enrData, error: enrError } = await supabase
      .from("lxp_enrollments")
      .select("id,student_profile_id,course_id,status,created_at")
      .order("created_at", { ascending: false });

    if (enrError) throw enrError;

    const enrollmentsBase = (enrData ?? []) as EnrollmentRow[];

    const studentIds = Array.from(
      new Set(enrollmentsBase.map((e) => e.student_profile_id)),
    );
    const courseIds = Array.from(new Set(enrollmentsBase.map((e) => e.course_id)));

    const [studentsResp, coursesResp] = await Promise.all([
      supabase
        .from("lxp_profiles")
        .select("id,name,email")
        .in("id", studentIds),
      supabase
        .from("lxp_courses")
        .select("id,name")
        .in("id", courseIds),
    ]);

    if (studentsResp.error) throw studentsResp.error;
    if (coursesResp.error) throw coursesResp.error;

    const studentsMap = new Map<string, ProfileRow>();
    (studentsResp.data ?? []).forEach((s) => studentsMap.set(s.id, s as ProfileRow));

    const coursesMap = new Map<string, CourseRow>();
    (coursesResp.data ?? []).forEach((c) => coursesMap.set(c.id, c as CourseRow));

    const enriched = enrollmentsBase.map((e) => {
      const s = studentsMap.get(e.student_profile_id);
      const c = coursesMap.get(e.course_id);
      return {
        ...e,
        studentName: s?.name ?? s?.email ?? e.student_profile_id,
        courseName: c?.name ?? e.course_id,
      };
    });

    setEnrollments(enriched);
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchStudents(), fetchCourses()]);
        await fetchEnrollments();
      } catch {
        toast.error("Erro ao carregar dados de matrículas");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEnrollments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return enrollments;
    return enrollments.filter((e) => {
      const s = (e.studentName ?? "").toLowerCase();
      const c = (e.courseName ?? "").toLowerCase();
      return s.includes(q) || c.includes(q);
    });
  }, [enrollments, search]);

  const handleCreateEnrollment = async () => {
    if (!studentId || !courseId) {
      toast.error("Selecione um aluno e um curso");
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from("lxp_enrollments").insert({
        student_profile_id: studentId,
        course_id: courseId,
        status: "active",
      });

      if (error) throw error;

      toast.success("Matrícula criada com sucesso");

      // Reset defaults
      setStudentId("");
      setCourseId("");

      await fetchEnrollments();
    } catch (e) {
      toast.error("Erro ao criar matrícula (verifique se já não existe)");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Matrículas"
        description="Criação mínima de matrícula para a entrega da Semana 1"
      >
        <Button onClick={handleCreateEnrollment} disabled={creating}>
          <Plus className="h-4 w-4 mr-2" />
          Matricular
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Label>Aluno (student)</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name ?? s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Curso</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleCreateEnrollment} disabled={creating}>
              {creating ? "Matriculando..." : "Criar matrícula"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Esta tela é propositadamente simples para validar o fluxo Backoffice → LXP.
            </p>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Aluno ou curso..."
                />
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : filteredEnrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma matrícula encontrada.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Criada em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrollments.slice(0, 50).map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="max-w-[260px]">
                          <div className="truncate">{e.studentName}</div>
                        </TableCell>
                        <TableCell className="max-w-[320px]">
                          <div className="truncate">{e.courseName}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              e.status === "active"
                                ? "success"
                                : e.status === "completed"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {e.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {new Date(e.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

