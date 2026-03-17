import { useState, useEffect, useCallback } from "react"
import {
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  CreditCard,
  TicketCheck,
  Gamepad2,
  Bot,
  Award,
  Settings,
  Palette,
  Package,
  LayoutGrid,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

const STORAGE_KEY = "lxp-admin-module-visibility"

export interface ModuleConfig {
  id: string
  title: string
  description: string
  icon: LucideIcon
  visible: boolean
  locked?: boolean
}

// Definição de todos os módulos do sistema
export const allModules: Omit<ModuleConfig, "visible">[] = [
  {
    id: "/",
    title: "Início",
    description: "Dashboard principal com visão geral",
    icon: LayoutDashboard,
    locked: true,
  },
  {
    id: "/admin/alunos",
    title: "Alunos",
    description: "Gestão de alunos e matrículas",
    icon: Users,
  },
  {
    id: "/admin/equipe",
    title: "Equipe",
    description: "Membros da equipe administrativa",
    icon: UserCog,
  },
  {
    id: "/admin/cursos",
    title: "Cursos",
    description: "Gestão de cursos e conteúdo",
    icon: BookOpen,
  },
  {
    id: "/admin/produtos",
    title: "Produtos",
    description: "E-commerce e modelos de negócio",
    icon: Package,
  },
  {
    id: "/admin/financeiro",
    title: "Financeiro",
    description: "Faturamento e cobranças",
    icon: CreditCard,
  },
  {
    id: "/admin/tickets",
    title: "Tickets",
    description: "Suporte e atendimento",
    icon: TicketCheck,
  },
  {
    id: "/admin/gamificacao",
    title: "Gamificação",
    description: "Conquistas, pontos e rankings",
    icon: Gamepad2,
  },
  {
    id: "/admin/ai-tutor",
    title: "AI Tutor",
    description: "Assistente de IA para alunos",
    icon: Bot,
  },
  {
    id: "/admin/certificados",
    title: "Certificados",
    description: "Emissão e modelos de certificados",
    icon: Award,
  },
  {
    id: "/admin/configuracoes",
    title: "Geral",
    description: "Configurações da instituição",
    icon: Settings,
  },
  {
    id: "/kitchen-sink",
    title: "Design System",
    description: "Componentes e estilos do sistema",
    icon: Palette,
  },
  {
    id: "/dev/modules",
    title: "Módulos",
    description: "Gerenciamento de visibilidade dos módulos",
    icon: LayoutGrid,
    locked: true,
  },
]

// Estado padrão: todos visíveis
const getDefaultVisibility = (): Record<string, boolean> => {
  return allModules.reduce((acc, module) => {
    acc[module.id] = true
    return acc
  }, {} as Record<string, boolean>)
}

// Carregar do localStorage
const loadFromStorage = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge com defaults para garantir que novos módulos sejam visíveis
      return { ...getDefaultVisibility(), ...parsed }
    }
  } catch (e) {
    console.error("Erro ao carregar configuração de módulos:", e)
  }
  return getDefaultVisibility()
}

// Salvar no localStorage
const saveToStorage = (visibility: Record<string, boolean>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility))
  } catch (e) {
    console.error("Erro ao salvar configuração de módulos:", e)
  }
}

export const useModuleVisibility = () => {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(loadFromStorage)

  // Sincronizar com localStorage
  useEffect(() => {
    saveToStorage(visibility)
  }, [visibility])

  // Verificar se um módulo está visível
  const isModuleVisible = useCallback(
    (moduleId: string): boolean => {
      const module = allModules.find((m) => m.id === moduleId)
      // Módulos locked sempre visíveis
      if (module?.locked) return true
      return visibility[moduleId] ?? true
    },
    [visibility]
  )

  // Toggle de visibilidade
  const toggleModule = useCallback((moduleId: string) => {
    const module = allModules.find((m) => m.id === moduleId)
    if (module?.locked) return // Não pode alterar módulos locked

    setVisibility((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }, [])

  // Resetar para padrão (todos visíveis)
  const resetToDefault = useCallback(() => {
    const defaultVisibility = getDefaultVisibility()
    setVisibility(defaultVisibility)
  }, [])

  // Ativar todos
  const enableAll = useCallback(() => {
    const allEnabled = allModules.reduce((acc, module) => {
      acc[module.id] = true
      return acc
    }, {} as Record<string, boolean>)
    setVisibility(allEnabled)
  }, [])

  // Desativar todos (exceto locked)
  const disableAll = useCallback(() => {
    const allDisabled = allModules.reduce((acc, module) => {
      acc[module.id] = module.locked ? true : false
      return acc
    }, {} as Record<string, boolean>)
    setVisibility(allDisabled)
  }, [])

  // Obter lista de módulos com status de visibilidade
  const getModulesWithVisibility = useCallback((): ModuleConfig[] => {
    return allModules.map((module) => ({
      ...module,
      visible: isModuleVisible(module.id),
    }))
  }, [isModuleVisible])

  // Contagem de módulos ativos
  const getActiveCount = useCallback((): { active: number; total: number } => {
    const modules = getModulesWithVisibility()
    const active = modules.filter((m) => m.visible).length
    return { active, total: modules.length }
  }, [getModulesWithVisibility])

  return {
    visibility,
    isModuleVisible,
    toggleModule,
    resetToDefault,
    enableAll,
    disableAll,
    getModulesWithVisibility,
    getActiveCount,
  }
}
