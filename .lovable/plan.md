

## Implementar Botao "Matricular Aluno" com Busca na Base

Criar um dialog de matricula que permite buscar e selecionar alunos ja cadastrados no sistema para matricula-los no curso atual.

---

### Fluxo de Usuario

1. Usuario clica em "Matricular Aluno" na aba de alunos do curso
2. Abre um dialog com campo de busca
3. Usuario digita o nome ou email do aluno
4. Sistema exibe lista de alunos encontrados (excluindo ja matriculados)
5. Usuario seleciona um ou mais alunos
6. Usuario confirma a matricula
7. Sistema adiciona os alunos a lista de matriculados

---

### Novo Componente: EnrollStudentDialog

```text
┌─────────────────────────────────────────────────────────────┐
│ Matricular Aluno                                       [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Busque alunos cadastrados para matricular neste curso      │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔍 Buscar por nome ou email...                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Alunos Encontrados                                         │
│  ─────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ☐ [Avatar] Maria Silva Santos                          ││
│  │            maria.silva@email.com                        ││
│  │            [Ativo] - Matriculado em 2 cursos            ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ ☐ [Avatar] Joao Pedro Oliveira                         ││
│  │            joao.oliveira@email.com                      ││
│  │            [Ativo] - Matriculado em 1 curso             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Alunos Selecionados: 0                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                           [Cancelar]  [Matricular]          │
└─────────────────────────────────────────────────────────────┘
```

---

### Arquivos a Modificar/Criar

| Arquivo | Acao |
|---------|------|
| Novo: `src/components/admin/EnrollStudentDialog.tsx` | Criar dialog de matricula |
| `src/components/admin/CourseStudentsTab.tsx` | Adicionar estado e integracao com dialog |

---

### Estrutura do EnrollStudentDialog

**Props:**

```typescript
interface EnrollStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  courseName: string
  enrolledStudentIds: string[]  // IDs dos alunos ja matriculados
  allStudents: Student[]        // Todos os alunos do sistema
  onEnroll: (studentIds: string[]) => void
}
```

**Estado Interno:**

```typescript
const [search, setSearch] = useState("")
const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
```

**Logica de Filtragem:**

1. Excluir alunos ja matriculados no curso
2. Filtrar por nome ou email baseado na busca
3. Ordenar por nome

---

### Alteracoes no CourseStudentsTab

**Novos Estados:**

```typescript
const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
const [enrolledStudents, setEnrolledStudents] = useState<Student[]>(students)
```

**Nova Funcao de Matricula:**

```typescript
const handleEnrollStudents = (studentIds: string[]) => {
  // Buscar alunos selecionados na lista geral
  // Adicionar enrollment para o curso atual
  // Atualizar estado local
  // Mostrar toast de sucesso
}
```

**Conectar Botao:**

```typescript
<Button onClick={() => setEnrollDialogOpen(true)}>
  <UserPlus className="h-4 w-4 mr-2" />
  Matricular Aluno
</Button>
```

---

### Comportamento da Busca

- Busca em tempo real (filtro local)
- Minimo 0 caracteres para mostrar todos disponiveis
- Case-insensitive
- Busca em nome e email
- Mostra contador de resultados

---

### Estados Visuais

**Nenhuma busca:**
- Exibe todos os alunos disponiveis (nao matriculados)

**Sem resultados:**
- Mensagem "Nenhum aluno encontrado"
- Sugestao de ajustar a busca

**Todos ja matriculados:**
- Mensagem "Todos os alunos ja estao matriculados neste curso"

---

### Integracao com Dados

**Prop allStudents:**
- O CourseStudentsTab precisara receber a lista completa de alunos (mockStudents) para poder buscar
- Alem da lista de alunos ja matriculados no curso

**Atualizacao em CourseDetailsPage:**
- Passar `allStudents={mockStudents}` para o CourseStudentsTab
- O componente gerenciara seu estado local de alunos matriculados

---

### Secao Tecnica

**Componente EnrollStudentDialog:**

```typescript
// Imports
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, UserPlus } from "lucide-react"
import { type Student } from "@/lib/mock-data"

// Filtragem de alunos disponiveis
const availableStudents = allStudents.filter(
  student => !enrolledStudentIds.includes(student.id)
)

const filteredStudents = availableStudents.filter(
  student =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.email.toLowerCase().includes(search.toLowerCase())
)
```

**Atualizacao do CourseStudentsTab Props:**

```typescript
interface CourseStudentsTabProps {
  courseId: string
  courseName: string           // Novo
  students: Student[]
  allStudents: Student[]       // Novo
}
```

---

### Ordem de Implementacao

1. Criar componente `EnrollStudentDialog.tsx`
2. Atualizar props de `CourseStudentsTab.tsx`
3. Adicionar estado e handler de matricula no `CourseStudentsTab.tsx`
4. Atualizar `CourseDetailsPage.tsx` para passar as novas props

