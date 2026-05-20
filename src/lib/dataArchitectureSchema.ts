/**
 * Documentação visual (mock) do modelo de dados — mesmo schema `public` no Supabase.
 * A divisão por app reflete o uso principal; várias tabelas são compartilhadas.
 */

export type SchemaColumnKind = "pk" | "fk" | "column"

export type SchemaColumn = {
  name: string
  kind: SchemaColumnKind
  sqlType: string
  /** Destino lógico da FK (ex.: public.lxp_profiles) */
  fkRef?: string
  /** Uso da coluna em linguagem de negócio */
  description: string
}

export type SchemaTable = {
  name: string
  /** Uma linha sobre o papel da tabela no app */
  purpose: string
  columns: SchemaColumn[]
  /** Rótulo no canto do card (ex.: `public` Supabase vs `b42.api` biblioteca externa) */
  schemaLabel?: string
}

export type DataArchitectureSection = {
  id: "backoffice" | "alunos" | "b42"
  label: string
  /** Nome curto para o título estilo “schema” */
  schemaHighlight: string
  intro: string
  tables: SchemaTable[]
}

export const DATA_ARCHITECTURE_SECTIONS: DataArchitectureSection[] = [
  {
    id: "backoffice",
    label: "LXP Backoffice",
    schemaHighlight: "admin.*",
    intro:
      "Cadastro acadêmico, equipe administrativa, certificados (templates/assinaturas), regras de gamificação e estrutura de cursos. Escrita privilegiada via papéis admin e Edge Functions onde aplicável.",
    tables: [
      {
        name: "backoffice_team_members",
        purpose: "Membros da equipe com acesso ao painel; vínculo com usuário Auth após convite.",
        columns: [
          {
            name: "id",
            kind: "pk",
            sqlType: "uuid",
            description: "Identificador do vínculo equipe–usuário.",
          },
          {
            name: "user_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "auth.users",
            description: "Usuário Supabase Auth correspondente ao membro.",
          },
          {
            name: "name",
            kind: "column",
            sqlType: "text",
            description: "Nome exibido no backoffice.",
          },
          {
            name: "email",
            kind: "column",
            sqlType: "text",
            description: "E-mail de login / convite.",
          },
          {
            name: "role",
            kind: "column",
            sqlType: "text",
            description: "Papel operacional (admin, coordenador, professor, etc.).",
          },
          {
            name: "department",
            kind: "column",
            sqlType: "text",
            description: "Setor opcional para organização interna.",
          },
          {
            name: "created_at",
            kind: "column",
            sqlType: "timestamptz",
            description: "Criação do registro.",
          },
          {
            name: "updated_at",
            kind: "column",
            sqlType: "timestamptz",
            description: "Última atualização.",
          },
          {
            name: "updated_by",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_profiles",
            description: "Quem alterou por último (auditoria leve).",
          },
        ],
      },
      {
        name: "lxp_certificate_templates",
        purpose: "Modelos visuais/legais de certificado disponíveis para emissão.",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Template." },
          { name: "name", kind: "column", sqlType: "text", description: "Nome interno do modelo." },
          { name: "description", kind: "column", sqlType: "text", description: "Notas para a equipe." },
          { name: "is_active", kind: "column", sqlType: "boolean", description: "Se pode ser usado em novas emissões." },
          { name: "created_at", kind: "column", sqlType: "timestamptz", description: "Criação." },
          { name: "updated_at", kind: "column", sqlType: "timestamptz", description: "Atualização." },
        ],
      },
      {
        name: "lxp_certificate_signatures",
        purpose: "Assinaturas vinculadas a um template (cargos, ordem, arte no Storage).",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Assinatura." },
          {
            name: "template_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_certificate_templates",
            description: "Template ao qual a assinatura pertence.",
          },
          { name: "signer_name", kind: "column", sqlType: "text", description: "Nome no certificado." },
          { name: "signer_title", kind: "column", sqlType: "text", description: "Cargo do signatário." },
          { name: "image_path", kind: "column", sqlType: "text", description: "Caminho da imagem no Storage (futuro)." },
          { name: "sort_order", kind: "column", sqlType: "integer", description: "Ordem de exibição." },
          { name: "created_at", kind: "column", sqlType: "timestamptz", description: "Criação." },
        ],
      },
      {
        name: "lxp_gamification_xp_rules",
        purpose: "Regras de pontos por ação (ex.: aula concluída, disciplina aprovada).",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Regra." },
          { name: "action_key", kind: "column", sqlType: "text", description: "Chave estável consumida por triggers/app." },
          { name: "label", kind: "column", sqlType: "text", description: "Rótulo para UI admin." },
          { name: "category", kind: "column", sqlType: "text", description: "Agrupamento (lesson, quiz, etc.)." },
          { name: "xp_value", kind: "column", sqlType: "integer", description: "Pontos concedidos por ocorrência." },
          { name: "sort_order", kind: "column", sqlType: "integer", description: "Ordem na listagem." },
          { name: "is_active", kind: "column", sqlType: "boolean", description: "Se a regra está em uso." },
          { name: "created_at", kind: "column", sqlType: "timestamptz", description: "Criação." },
          { name: "updated_at", kind: "column", sqlType: "timestamptz", description: "Atualização." },
        ],
      },
      {
        name: "lxp_gamification_levels",
        purpose: "Degraus de nível do aluno por XP acumulado total.",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Nível." },
          { name: "level_number", kind: "column", sqlType: "integer", description: "Número exibido (1, 2, …)." },
          { name: "title", kind: "column", sqlType: "text", description: "Nome do nível (ex.: Iniciante)." },
          { name: "min_total_xp", kind: "column", sqlType: "integer", description: "XP mínimo acumulado para alcançar o nível." },
          { name: "is_active", kind: "column", sqlType: "boolean", description: "Se entra no cálculo da UI." },
          { name: "created_at", kind: "column", sqlType: "timestamptz", description: "Criação." },
          { name: "updated_at", kind: "column", sqlType: "timestamptz", description: "Atualização." },
        ],
      },
      {
        name: "lxp_gamification_badges",
        purpose: "Conquistas configuráveis (limiar de aulas/disciplinas, raridade, ícone).",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Badge." },
          { name: "slug", kind: "column", sqlType: "text", description: "Identificador estável único." },
          { name: "name", kind: "column", sqlType: "text", description: "Nome amigável." },
          { name: "description", kind: "column", sqlType: "text", description: "Texto para o aluno." },
          { name: "icon_id", kind: "column", sqlType: "text", description: "Chave do ícone na UI." },
          { name: "rarity", kind: "column", sqlType: "text", description: "common | rare | epic | legendary." },
          { name: "rule_type", kind: "column", sqlType: "text", description: "Tipo de regra (aulas concluídas, disciplinas aprovadas…)." },
          { name: "rule_threshold", kind: "column", sqlType: "integer", description: "Meta numérica da regra." },
          { name: "xp_reward", kind: "column", sqlType: "integer", description: "XP extra opcional ao conceder." },
          { name: "sort_order", kind: "column", sqlType: "integer", description: "Ordem na vitrine." },
          { name: "is_active", kind: "column", sqlType: "boolean", description: "Se pode ser conquistada." },
          { name: "created_at", kind: "column", sqlType: "timestamptz", description: "Criação." },
          { name: "updated_at", kind: "column", sqlType: "timestamptz", description: "Atualização." },
        ],
      },
      {
        name: "lxp_courses",
        purpose: "Cursos/trilhas ofertados pela instituição.",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Curso." },
          { name: "name", kind: "column", sqlType: "text", description: "Nome público." },
          { name: "description", kind: "column", sqlType: "text", description: "Resumo opcional." },
          { name: "created_at", kind: "column", sqlType: "timestamptz", description: "Criação." },
          { name: "updated_at", kind: "column", sqlType: "timestamptz", description: "Atualização." },
        ],
      },
      {
        name: "lxp_course_periods",
        purpose: "Períodos ou fases dentro de um curso (organização da grade).",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Período." },
          {
            name: "course_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_courses",
            description: "Curso pai.",
          },
          { name: "name", kind: "column", sqlType: "text", description: "Nome do período." },
          { name: "sort_order", kind: "column", sqlType: "integer", description: "Ordem na trilha." },
        ],
      },
      {
        name: "lxp_course_disciplines",
        purpose: "Disciplinas vinculadas a um período (ponte para conteúdo externo / biblioteca).",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Disciplina no curso." },
          {
            name: "course_period_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_course_periods",
            description: "Período ao qual pertence.",
          },
          { name: "external_discipline_id", kind: "column", sqlType: "text", description: "ID da disciplina no catálogo/biblioteca." },
          { name: "title", kind: "column", sqlType: "text", description: "Título exibido." },
          { name: "sort_order", kind: "column", sqlType: "integer", description: "Ordem no período." },
        ],
      },
      {
        name: "lxp_course_library_links",
        purpose: "Associação entre disciplina do curso e item da biblioteca de conteúdo.",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Vínculo." },
          {
            name: "course_discipline_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_course_disciplines",
            description: "Disciplina no curso.",
          },
          { name: "library_content_id", kind: "column", sqlType: "text", description: "Conteúdo na biblioteca externa." },
          { name: "linked_at", kind: "column", sqlType: "timestamptz", description: "Quando o vínculo foi criado." },
        ],
      },
    ],
  },
  {
    id: "alunos",
    label: "LXP Alunos",
    schemaHighlight: "student.*",
    intro:
      "Perfil do aluno, matrículas, progresso de aulas e disciplinas, gamificação em runtime (eventos e conquistas) e certificados emitidos para o portfólio. Leitura e escrita sob RLS como estudante.",
    tables: [
      {
        name: "lxp_profiles",
        purpose: "Perfil LXP vinculado ao Auth; papel student ou admin (portal usa student).",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Identificador do perfil (usado em FKs de progresso)." },
          {
            name: "user_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "auth.users",
            description: "Conta Supabase do usuário.",
          },
          { name: "name", kind: "column", sqlType: "text", description: "Nome de exibição." },
          { name: "email", kind: "column", sqlType: "text", description: "E-mail de contato." },
          { name: "phone", kind: "column", sqlType: "text", description: "Telefone opcional." },
          { name: "birth_date", kind: "column", sqlType: "date", description: "Data de nascimento opcional." },
          { name: "role", kind: "column", sqlType: "text", description: "student | admin (controle de acesso)." },
          { name: "created_at", kind: "column", sqlType: "timestamptz", description: "Criação." },
          { name: "updated_at", kind: "column", sqlType: "timestamptz", description: "Atualização." },
        ],
      },
      {
        name: "lxp_enrollments",
        purpose: "Matrícula do aluno em um curso.",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Matrícula." },
          {
            name: "student_profile_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_profiles",
            description: "Aluno.",
          },
          {
            name: "course_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_courses",
            description: "Curso.",
          },
          { name: "status", kind: "column", sqlType: "text", description: "active | inactive | blocked." },
          { name: "created_at", kind: "column", sqlType: "timestamptz", description: "Quando matriculou." },
        ],
      },
      {
        name: "lxp_student_lesson_progress",
        purpose: "Status por aula/unidade externa; dispara XP de aula ao concluir.",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Linha de progresso (quando aplicável)." },
          {
            name: "student_profile_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_profiles",
            description: "Aluno.",
          },
          { name: "external_discipline_id", kind: "column", sqlType: "text", description: "Disciplina no catálogo externo." },
          { name: "external_unit_id", kind: "column", sqlType: "text", description: "Identificador da aula/unidade." },
          { name: "status", kind: "column", sqlType: "text", description: "pending | in_progress | completed." },
          { name: "completed_at", kind: "column", sqlType: "timestamptz", description: "Quando marcou concluída." },
          { name: "last_accessed_at", kind: "column", sqlType: "timestamptz", description: "Último acesso." },
          { name: "updated_at", kind: "column", sqlType: "timestamptz", description: "Última atualização." },
        ],
      },
      {
        name: "lxp_student_discipline_progress",
        purpose: "Progresso agregado por disciplina do curso; aprovação dispara XP e certificado.",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Registro de progresso." },
          {
            name: "student_profile_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_profiles",
            description: "Aluno.",
          },
          {
            name: "course_discipline_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_course_disciplines",
            description: "Disciplina na grade.",
          },
          { name: "status", kind: "column", sqlType: "text", description: "pending | in_progress | approved | failed." },
          { name: "grade", kind: "column", sqlType: "numeric", description: "Nota opcional." },
          { name: "xp_earned", kind: "column", sqlType: "integer", description: "XP legado por disciplina (complemento a eventos)." },
          { name: "completed_at", kind: "column", sqlType: "timestamptz", description: "Primeira vez em approved (auditoria)." },
          { name: "last_updated_at", kind: "column", sqlType: "timestamptz", description: "Última mudança de estado." },
        ],
      },
      {
        name: "lxp_student_xp_events",
        purpose: "Histórico imutável de ganho de XP (idempotente por chave de negócio).",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Evento." },
          {
            name: "student_profile_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_profiles",
            description: "Aluno que recebeu XP.",
          },
          { name: "action_key", kind: "column", sqlType: "text", description: "Chave alinhada a lxp_gamification_xp_rules." },
          { name: "xp_delta", kind: "column", sqlType: "integer", description: "Pontos creditados neste evento." },
          { name: "ref", kind: "column", sqlType: "jsonb", description: "Contexto (aula, disciplina, ids externos)." },
          { name: "idempotency_key", kind: "column", sqlType: "text", description: "Evita duplicar o mesmo ganho." },
          { name: "created_at", kind: "column", sqlType: "timestamptz", description: "Momento do evento." },
        ],
      },
      {
        name: "lxp_student_badge_awards",
        purpose: "Conquistas já liberadas para o aluno (join com lxp_gamification_badges na UI).",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Concessão." },
          {
            name: "student_profile_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_profiles",
            description: "Aluno.",
          },
          {
            name: "badge_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_gamification_badges",
            description: "Badge conquistada.",
          },
          { name: "earned_at", kind: "column", sqlType: "timestamptz", description: "Quando foi concedida." },
        ],
      },
      {
        name: "lxp_certificate_issues",
        purpose: "Emissão por (aluno, disciplina) com código de validação pública.",
        columns: [
          { name: "id", kind: "pk", sqlType: "uuid", description: "Emissão." },
          {
            name: "student_profile_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_profiles",
            description: "Aluno titular.",
          },
          {
            name: "course_discipline_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_course_disciplines",
            description: "Disciplina concluída.",
          },
          {
            name: "template_id",
            kind: "fk",
            sqlType: "uuid",
            fkRef: "public.lxp_certificate_templates",
            description: "Modelo usado (pode ser nulo até regra de template).",
          },
          { name: "validation_code", kind: "column", sqlType: "text", description: "Código único de verificação." },
          { name: "issued_at", kind: "column", sqlType: "timestamptz", description: "Data da emissão lógica." },
          { name: "created_at", kind: "column", sqlType: "timestamptz", description: "Criação do registro." },
        ],
      },
    ],
  },
  {
    id: "b42",
    label: "B42",
    schemaHighlight: "biblioteca.*",
    intro:
      "Modelo relacional da **biblioteca de conteúdo** consumida pela API (EAD Stock / Gael), conforme ERD e exemplos de `GET /scout/disciplinas/list` e `GET /disciplinas/get/{id}`. Não existe no Supabase do LXP — é o domínio de dados do catálogo externo; nosso vínculo interno continua em `lxp_course_library_links.library_content_id` → `disciplinas.id`.",
    tables: [
      {
        name: "disciplinas",
        schemaLabel: "b42.api",
        purpose: "Disciplina no catálogo externo; metadados, situação de publicação e fornecedor.",
        columns: [
          { name: "id", kind: "pk", sqlType: "bigint", description: "ID usado no LXP em `library_content_id` quando tipo discipline." },
          { name: "nome", kind: "column", sqlType: "text", description: "Nome exibido; espelhado em `library_content_name` no link interno." },
          { name: "hash", kind: "column", sqlType: "text", description: "Identificador curto estável (ex.: capa/arquivos)." },
          { name: "ementa", kind: "column", sqlType: "text", description: "Ementa textual." },
          { name: "isbn", kind: "column", sqlType: "text", description: "ISBN quando houver." },
          { name: "objetivos", kind: "column", sqlType: "text", description: "Objetivos pedagógicos." },
          { name: "fornecedor_id", kind: "fk", sqlType: "bigint", fkRef: "b42.fornecedores", description: "Fornecedor do conteúdo." },
          { name: "customizada", kind: "column", sqlType: "integer", description: "Flag de customização." },
          { name: "disciplina_situacao_id", kind: "column", sqlType: "bigint", description: "Situação (ex.: 3 = Disponível); regra de filtro no portal." },
          { name: "ativo", kind: "column", sqlType: "integer", description: "Publicação lógica." },
          { name: "carga_horaria", kind: "column", sqlType: "integer", description: "CH declarada." },
          { name: "revisor", kind: "column", sqlType: "text", description: "Revisor responsável." },
          { name: "deleted_at", kind: "column", sqlType: "timestamp", description: "Soft delete." },
          { name: "created_at", kind: "column", sqlType: "timestamp", description: "Criação." },
          { name: "updated_at", kind: "column", sqlType: "timestamp", description: "Atualização." },
          { name: "user_insert", kind: "column", sqlType: "text", description: "Quem inseriu." },
        ],
      },
      {
        name: "unidades",
        schemaLabel: "b42.api",
        purpose: "Aula/unidade de ensino; contém **url_caderno_digital** (caderno/e-book) e liga à disciplina via pivot.",
        columns: [
          { name: "id", kind: "pk", sqlType: "bigint", description: "ID da unidade; correlaciona com progresso `external_unit_id` no LXP." },
          { name: "nome", kind: "column", sqlType: "text", description: "Título da aula." },
          { name: "fornecedor_id", kind: "fk", sqlType: "bigint", fkRef: "b42.fornecedores", description: "Fornecedor da unidade." },
          { name: "disciplina_original_id", kind: "fk", sqlType: "bigint", fkRef: "b42.disciplinas", description: "Disciplina de origem." },
          {
            name: "url_caderno_digital",
            kind: "column",
            sqlType: "text",
            description: "Caminho do caderno digital (ex.: `_vendors/educaspace/{hash}/index.html`); pode precisar de base URL CDN para abrir no browser.",
          },
          { name: "ativo", kind: "column", sqlType: "integer", description: "Unidade ativa." },
          { name: "deleted_at", kind: "column", sqlType: "timestamp", description: "Soft delete." },
          { name: "created_at", kind: "column", sqlType: "timestamp", description: "Criação." },
          { name: "updated_at", kind: "column", sqlType: "timestamp", description: "Atualização." },
          { name: "user_insert", kind: "column", sqlType: "text", description: "Quem inseriu." },
          { name: "order", kind: "column", sqlType: "integer", description: "Ordem da unidade (também refletida em `pivot.order` no JSON da API)." },
        ],
      },
      {
        name: "disciplina_unidades",
        schemaLabel: "b42.api",
        purpose: "N:N disciplina ↔ unidade com **ordem** (`order`); no JSON da API aparece como `pivot.order` em `unidades[]`.",
        columns: [
          { name: "id", kind: "pk", sqlType: "bigint", description: "Surrogate da relação." },
          { name: "disciplina_id", kind: "fk", sqlType: "bigint", fkRef: "b42.disciplinas", description: "Disciplina." },
          { name: "unidade_id", kind: "fk", sqlType: "bigint", fkRef: "b42.unidades", description: "Unidade (aula)." },
          { name: "order", kind: "column", sqlType: "integer", description: "Ordem de exibição (espelho de `pivot.order`)." },
          { name: "created_at", kind: "column", sqlType: "timestamp", description: "Criação." },
          { name: "updated_at", kind: "column", sqlType: "timestamp", description: "Atualização." },
          { name: "deleted_at", kind: "column", sqlType: "timestamp", description: "Soft delete." },
          { name: "virtual_deleted_flag", kind: "column", sqlType: "text", description: "Flag virtual de exclusão." },
          { name: "user_insert", kind: "column", sqlType: "text", description: "Quem inseriu." },
        ],
      },
      {
        name: "fornecedores",
        schemaLabel: "b42.api",
        purpose: "Editora/fornecedor de conteúdo (ex.: EducaSpace); agrupa plano e tokens de grupo.",
        columns: [
          { name: "id", kind: "pk", sqlType: "bigint", description: "Fornecedor." },
          { name: "nome", kind: "column", sqlType: "text", description: "Nome comercial." },
          { name: "group_id_token", kind: "column", sqlType: "text", description: "Token de grupo quando aplicável." },
          { name: "plano_id", kind: "column", sqlType: "bigint", description: "Plano contratual." },
          { name: "ativo", kind: "column", sqlType: "integer", description: "Ativo." },
          { name: "created_at", kind: "column", sqlType: "timestamp", description: "Criação." },
          { name: "updated_at", kind: "column", sqlType: "timestamp", description: "Atualização." },
          { name: "deleted_at", kind: "column", sqlType: "timestamp", description: "Soft delete." },
          { name: "virtual_deleted_flag", kind: "column", sqlType: "text", description: "Flag virtual." },
          { name: "user_insert", kind: "column", sqlType: "text", description: "Quem inseriu." },
        ],
      },
      {
        name: "unidade_autores",
        schemaLabel: "b42.api",
        purpose: "Autores vinculados à unidade (metadados para catálogo e certificação).",
        columns: [
          { name: "id", kind: "pk", sqlType: "bigint", description: "Relação." },
          { name: "unidade_id", kind: "fk", sqlType: "bigint", fkRef: "b42.unidades", description: "Unidade." },
          { name: "autor_id", kind: "fk", sqlType: "bigint", fkRef: "b42.autores", description: "Autor (tabela não detalhada no ERD resumido)." },
          { name: "created_at", kind: "column", sqlType: "timestamp", description: "Criação." },
          { name: "updated_at", kind: "column", sqlType: "timestamp", description: "Atualização." },
          { name: "deleted_at", kind: "column", sqlType: "timestamp", description: "Soft delete." },
          { name: "virtual_deleted_flag", kind: "column", sqlType: "text", description: "Flag virtual." },
          { name: "user_insert", kind: "column", sqlType: "text", description: "Quem inseriu." },
        ],
      },
      {
        name: "unidade_tags",
        schemaLabel: "b42.api",
        purpose: "Tags por unidade para filtros e descoberta no catálogo.",
        columns: [
          { name: "id", kind: "pk", sqlType: "bigint", description: "Relação." },
          { name: "unidade_id", kind: "fk", sqlType: "bigint", fkRef: "b42.unidades", description: "Unidade." },
          { name: "tag_id", kind: "fk", sqlType: "bigint", fkRef: "b42.tags", description: "Tag (tabela não detalhada no ERD resumido)." },
          { name: "created_at", kind: "column", sqlType: "timestamp", description: "Criação." },
          { name: "updated_at", kind: "column", sqlType: "timestamp", description: "Atualização." },
          { name: "deleted_at", kind: "column", sqlType: "timestamp", description: "Soft delete." },
          { name: "virtual_deleted_flag", kind: "column", sqlType: "text", description: "Flag virtual." },
          { name: "user_insert", kind: "column", sqlType: "text", description: "Quem inseriu." },
        ],
      },
    ],
  },
]
