import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import DashboardOld from "./pages/admin/DashboardOld";
import CourseDetailsPage from "./pages/admin/CourseDetailsPage";
import StudentsPage from "./pages/admin/StudentsPage";
import FinancePage from "./pages/admin/FinancePage";
import GamificationPage from "./pages/admin/GamificationPage";
import AITutorPage from "./pages/admin/AITutorPage";
import CertificatesPage from "./pages/admin/CertificatesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import TeamPage from "./pages/admin/TeamPage";
import AdminSetPassword from "./pages/admin/AdminSetPassword";
import TicketsPage from "./pages/admin/TicketsPage";
import ProductsPage from "./pages/admin/ProductsPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminCoursesV1 from "./pages/admin/AdminCoursesV1";
import AdminEnrollmentsV1 from "./pages/admin/AdminEnrollmentsV1";
import CoursesPage from "./pages/admin/CoursesPage";
import DataArchitecturePage from "./pages/admin/DataArchitecturePage";
import ClientIntakePage from "./pages/admin/ClientIntakePage";
import NotFound from "./pages/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="dark">
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Login admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/definir-senha" element={<AdminSetPassword />} />

              {/* Dashboard (admin) */}
              <Route
                path="/"
                element={<ProtectedRoute element={<Dashboard />} requiredRole="admin" />}
              />
              <Route
                path="/dashboard-mock"
                element={<Navigate to="/" replace />}
              />
              <Route
                path="/dashboard-old"
                element={<ProtectedRoute element={<DashboardOld />} requiredRole="admin" />}
              />

              {/* Gestão de Usuários */}
              <Route
                path="/admin/alunos"
                element={<ProtectedRoute element={<StudentsPage />} requiredRole="admin" />}
              />
              <Route
                path="/admin/equipe"
                element={<ProtectedRoute element={<TeamPage />} requiredRole="admin" />}
              />

              {/* Acadêmico */}
              <Route
                path="/admin/cursos"
                element={<ProtectedRoute element={<CoursesPage />} requiredRole="admin" />}
              />
              {/* (opcional) V1 mínimo preservado como fallback */}
              <Route
                path="/admin/cursos-v1"
                element={<ProtectedRoute element={<AdminCoursesV1 />} requiredRole="admin" />}
              />
              <Route
                path="/admin/cursos/:courseId"
                element={
                  <ProtectedRoute element={<CourseDetailsPage />} requiredRole="admin" />
                }
              />
              <Route
                path="/admin/matriculas"
                element={<ProtectedRoute element={<AdminEnrollmentsV1 />} requiredRole="admin" />}
              />

              {/* E-commerce */}
              <Route
                path="/admin/produtos"
                element={<ProtectedRoute element={<ProductsPage />} requiredRole="admin" />}
              />

              {/* Secretaria */}
              <Route
                path="/admin/financeiro"
                element={<ProtectedRoute element={<FinancePage />} requiredRole="admin" />}
              />

              {/* Suporte */}
              <Route
                path="/admin/tickets"
                element={<ProtectedRoute element={<TicketsPage />} requiredRole="admin" />}
              />

              {/* Configurações */}
              <Route
                path="/admin/gamificacao"
                element={<ProtectedRoute element={<GamificationPage />} requiredRole="admin" />}
              />
              <Route
                path="/admin/ai-tutor"
                element={<ProtectedRoute element={<AITutorPage />} requiredRole="admin" />}
              />
              <Route
                path="/admin/certificados"
                element={<ProtectedRoute element={<CertificatesPage />} requiredRole="admin" />}
              />
              <Route
                path="/admin/configuracoes"
                element={<ProtectedRoute element={<SettingsPage />} requiredRole="admin" />}
              />
              <Route
                path="/admin/modelo-dados"
                element={<ProtectedRoute element={<DataArchitecturePage />} requiredRole="admin" />}
              />
              <Route
                path="/admin/roteiro-cliente"
                element={<ProtectedRoute element={<ClientIntakePage />} requiredRole="admin" />}
              />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
