import { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Edit,
  BookOpen,
  Users,
  Calendar,
  Link2,
  GraduationCap,
} from "lucide-react"
import type { CourseAdminInput } from "@/types/courseAdmin"
import { CourseGradesTab } from "@/components/admin/CourseGradesTab"
import { CourseContentTab } from "@/components/admin/CourseContentTab"
import { CourseStudentsTab } from "@/components/admin/CourseStudentsTab"
import { CourseDialog } from "@/components/admin/CourseDialog"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { useGetCourseDetail } from "@/hooks/queries/useGetCourseDetail"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import { useGetCourseRecentActivity } from "@/hooks/queries/useGetCourseRecentActivity"
import { getAdminErrorMessage } from "@/lib/adminErrorMessage"

const statusConfig = {
  active: { label: "Ativo", variant: "success" as const },
  draft: { label: "Rascunho", variant: "warning" as const },
  archived: { label: "Arquivado", variant: "secondary" as const },
}

const categoryConfig = {
  graduation: { label: "Graduação", variant: "default" as const },
  postgraduate: { label: "Pós-Graduação", variant: "info" as const },
  extension: { label: "Extensão", variant: "secondary" as const },
}

const COURSE_TABS = ["overview", "grades", "content", "students"] as const
type CourseTab = (typeof COURSE_TABS)[number]

function isCourseTab(value: string): value is CourseTab {
  return COURSE_TABS.includes(value as CourseTab)
}

const CourseDetailsPage = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CourseTab>(() => {
    if (!courseId) return "overview"
    const saved = localStorage.getItem(`course-details-active-tab:${courseId}`)
    return saved && isCourseTab(saved) ? saved : "overview"
  })
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: course, isLoading, error } = useGetCourseDetail(courseId)

  const { data: recentActivity = [] } = useGetCourseRecentActivity(courseId)

  useEffect(() => {
    if (!error) return

    toast({
      title: "Erro ao carregar curso",
      description: "Não foi possível carregar os detalhes do curso.",
      variant: "destructive",
    })
    navigate("/admin/cursos")
  }, [error, navigate])

  useEffect(() => {
    if (!courseId) return
    const saved = localStorage.getItem(`course-details-active-tab:${courseId}`)
    if (saved && isCourseTab(saved)) {
      setActiveTab(saved)
      return
    }
    setActiveTab("overview")
  }, [courseId])

  useEffect(() => {
    if (!courseId) return
    localStorage.setItem(`course-details-active-tab:${courseId}`, activeTab)
  }, [courseId, activeTab])

  if (!course) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <h2 className="text-2xl font-semibold">
            {isLoading ? "Carregando..." : "Curso não encontrado"}
          </h2>
          <Button variant="outline" onClick={() => navigate("/admin/cursos")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Cursos
          </Button>
        </div>
      </AdminLayout>
    )
  }

  const handleSaveCourse = async (updatedData: CourseAdminInput) => {
    if (!courseId) return
    const { error } = await supabase
      .from("lxp_courses")
      .update({
        name: updatedData.name,
        description: updatedData.description,
        category: updatedData.category,
        status: updatedData.status,
        external_library_id: updatedData.externalLibraryId?.trim() || null,
      })
      .eq("id", courseId)

    if (error) {
      toast({
        title: "Erro ao atualizar curso",
        description: getAdminErrorMessage("courses-update", error),
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Curso atualizado",
      description: "As alterações foram salvas com sucesso.",
    })

    await queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) })
  }

  return (
    <AdminLayout>
      <PageHeader
        title={course.name}
        description={course.description}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/cursos")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Curso
          </Button>
        </div>
      </PageHeader>

      {/* Edit Dialog */}
      <CourseDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        course={course}
        onSave={handleSaveCourse}
      />


      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="grades" className="gap-2">
            <Calendar className="h-4 w-4" />
            Grades
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <Link2 className="h-4 w-4" />
            Disciplinas Externas
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            Alunos
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-medium">{categoryConfig[course.category].label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{statusConfig[course.status].label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Grades Totais</p>
                    <p className="font-medium">{course.periods}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
                    <p className="font-medium">
                      {new Date(course.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm">{course.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Biblioteca Externa</CardTitle>
                <CardDescription>
                  Disciplinas externas vinculadas ao curso
                </CardDescription>
              </CardHeader>
              <CardContent>
                {course.externalLibraryId ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                      <Link2 className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium text-success">Vinculado</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {course.externalLibraryId}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Gerencie os vínculos na aba Disciplinas Externas
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Link2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="font-medium mb-1">Nenhuma biblioteca vinculada</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Vincule disciplinas externas para disponibilizar aos alunos
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("content")}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Vincular Disciplina
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem atividade recente para este curso.</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.actor}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.happenedAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades">
          <CourseGradesTab courseId={courseId!} />
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <CourseContentTab courseId={courseId!} />
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <CourseStudentsTab
            courseId={courseId!}
            courseName={course.name}
          />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}

export default CourseDetailsPage
