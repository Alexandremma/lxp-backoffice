import type { ReactElement } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/AuthProvider";
import { BackofficeAccessRoute } from "@/components/auth/BackofficeAccessRoute";
import Dashboard from "./pages/admin/Dashboard";
import CourseDetailsPage from "./pages/admin/CourseDetailsPage";
import StudentsPage from "./pages/admin/StudentsPage";
import GamificationPage from "./pages/admin/GamificationPage";
import CertificatesPage from "./pages/admin/CertificatesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import TeamPage from "./pages/admin/TeamPage";
import AdminSetPassword from "./pages/admin/AdminSetPassword";
import AdminLogin from "./pages/admin/AdminLogin";
import CoursesPage from "./pages/admin/CoursesPage";
import DataArchitecturePage from "./pages/admin/DataArchitecturePage";
import ClientIntakePage from "./pages/admin/ClientIntakePage";
import MyProfilePage from "./pages/admin/MyProfilePage";
import NotFound from "./pages/NotFound";

const guard = (
  element: ReactElement,
  permission?: Parameters<typeof BackofficeAccessRoute>[0]["permission"],
) => <BackofficeAccessRoute element={element} permission={permission} />;

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/definir-senha" element={<AdminSetPassword />} />

              <Route path="/" element={guard(<Dashboard />)} />

              <Route path="/admin/alunos" element={guard(<StudentsPage />)} />
              <Route path="/admin/equipe" element={guard(<TeamPage />)} />
              <Route path="/admin/cursos" element={guard(<CoursesPage />)} />
              <Route
                path="/admin/cursos/:courseId"
                element={guard(<CourseDetailsPage />, "cursos.detalhe")}
              />

              <Route path="/admin/gamificacao" element={guard(<GamificationPage />)} />
              <Route path="/admin/certificados" element={guard(<CertificatesPage />)} />
              <Route path="/admin/configuracoes" element={guard(<SettingsPage />)} />
              <Route path="/admin/perfil" element={guard(<MyProfilePage />)} />
              <Route path="/admin/modelo-dados" element={guard(<DataArchitecturePage />)} />
              <Route path="/admin/roteiro-cliente" element={guard(<ClientIntakePage />)} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
