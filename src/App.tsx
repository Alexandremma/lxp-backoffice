import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import DashboardMock from "./pages/admin/DashboardMock";
import CoursesPage from "./pages/admin/CoursesPage";
import CourseDetailsPage from "./pages/admin/CourseDetailsPage";
import StudentsPage from "./pages/admin/StudentsPage";
import FinancePage from "./pages/admin/FinancePage";
import GamificationPage from "./pages/admin/GamificationPage";
import AITutorPage from "./pages/admin/AITutorPage";
import CertificatesPage from "./pages/admin/CertificatesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import TeamPage from "./pages/admin/TeamPage";
import TicketsPage from "./pages/admin/TicketsPage";
import ProductsPage from "./pages/admin/ProductsPage";

import KitchenSink from "./pages/KitchenSink";
import DevModulesPage from "./pages/admin/DevModulesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="dark">
        <BrowserRouter>
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard-mock" element={<DashboardMock />} />

            {/* Gestão de Usuários */}
            <Route path="/admin/alunos" element={<StudentsPage />} />
            <Route path="/admin/equipe" element={<TeamPage />} />

            {/* Acadêmico */}
            <Route path="/admin/cursos" element={<CoursesPage />} />
            <Route path="/admin/cursos/:courseId" element={<CourseDetailsPage />} />

            {/* E-commerce */}
            <Route path="/admin/produtos" element={<ProductsPage />} />

            {/* Secretaria */}
            <Route path="/admin/financeiro" element={<FinancePage />} />

            {/* Suporte */}
            <Route path="/admin/tickets" element={<TicketsPage />} />

            {/* Configurações */}
            <Route path="/admin/gamificacao" element={<GamificationPage />} />
            <Route path="/admin/ai-tutor" element={<AITutorPage />} />
            <Route path="/admin/certificados" element={<CertificatesPage />} />
            <Route path="/admin/configuracoes" element={<SettingsPage />} />

            {/* Dev */}
            <Route path="/kitchen-sink" element={<KitchenSink />} />
            <Route path="/dev/modules" element={<DevModulesPage />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
