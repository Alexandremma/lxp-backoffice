import type { ReactElement } from "react";
import { Toaster } from "@/components/ui/toaster";

import { Toaster as Sonner } from "@/components/ui/sonner";

import { TooltipProvider } from "@/components/ui/tooltip";

import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "@/hooks/use-auth";

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

import NotFound from "./pages/NotFound";



const guard = (element: ReactElement, permission?: Parameters<typeof BackofficeAccessRoute>[0]["permission"]) => (

  <BackofficeAccessRoute element={element} permission={permission} />

);



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

              <Route path="/admin/login" element={<AdminLogin />} />

              <Route path="/admin/definir-senha" element={<AdminSetPassword />} />



              <Route path="/" element={guard(<Dashboard />)} />

              <Route path="/dashboard-mock" element={<Navigate to="/" replace />} />



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

              <Route path="/admin/modelo-dados" element={guard(<DataArchitecturePage />)} />

              <Route path="/admin/roteiro-cliente" element={guard(<ClientIntakePage />)} />



              {/* Módulos fora da entrega — redireciona para início */}

              <Route path="/admin/produtos" element={<Navigate to="/" replace />} />

              <Route path="/admin/financeiro" element={<Navigate to="/" replace />} />

              <Route path="/admin/tickets" element={<Navigate to="/" replace />} />

              <Route path="/admin/ai-tutor" element={<Navigate to="/" replace />} />

              <Route path="/dashboard-old" element={<Navigate to="/" replace />} />

              <Route path="/admin/cursos-v1" element={<Navigate to="/" replace />} />

              <Route path="/admin/matriculas" element={<Navigate to="/" replace />} />



              <Route path="*" element={<NotFound />} />

            </Routes>

          </BrowserRouter>

        </div>

      </TooltipProvider>

    </AuthProvider>

  </QueryClientProvider>

);



export default App;


