-- ============================================
-- STEP 2 — Grades/Disciplinas/Vínculos (schema + relacionamentos)
-- Supabase (PostgreSQL) — SEM RLS neste passo
-- Domínio de prefixo:
--   - lxp-alunos: prefixo lxp_
--   - backoffice: prefixo backoffice_
-- ============================================

-- ---------- 0) Ajustes em tabelas existentes (compatibilidade com UI) ----------

-- public.lxp_courses já existe (Semana 1)
-- Vamos adicionar colunas usadas no backoffice UI (categoria/periods/external_library_id)

ALTER TABLE public.lxp_courses
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'graduation';

ALTER TABLE public.lxp_courses
  ADD COLUMN IF NOT EXISTS periods integer NOT NULL DEFAULT 8;

ALTER TABLE public.lxp_courses
  ADD COLUMN IF NOT EXISTS external_library_id text;

-- CHECKs (executa apenas se ainda não existir constraint com o mesmo nome)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lxp_courses_category_check') THEN
    ALTER TABLE public.lxp_courses
      ADD CONSTRAINT lxp_courses_category_check
      CHECK (category IN ('graduation', 'postgraduate', 'extension'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lxp_courses_periods_check') THEN
    ALTER TABLE public.lxp_courses
      ADD CONSTRAINT lxp_courses_periods_check
      CHECK (periods >= 1 AND periods <= 20);
  END IF;
END $$;

-- ---------- 1) Grades/Períodos ----------

CREATE TABLE IF NOT EXISTS public.lxp_course_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.lxp_courses(id) ON DELETE CASCADE,
  number integer NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'current',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT lxp_course_periods_course_number_uk UNIQUE (course_id, number),
  CONSTRAINT lxp_course_periods_number_check CHECK (number >= 1),
  CONSTRAINT lxp_course_periods_status_check CHECK (status IN ('completed', 'current', 'upcoming'))
);

CREATE INDEX IF NOT EXISTS lxp_course_periods_course_id_idx
  ON public.lxp_course_periods (course_id);

-- ---------- 2) Disciplinas dentro do Período/Grade ----------

CREATE TABLE IF NOT EXISTS public.lxp_course_disciplines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_period_id uuid NOT NULL REFERENCES public.lxp_course_periods(id) ON DELETE CASCADE,

  name text NOT NULL,
  code text NOT NULL,
  workload integer NOT NULL DEFAULT 0, -- horas
  credits integer NOT NULL DEFAULT 0,  -- alinhado ao mock/UI
  professor text,
  status text NOT NULL DEFAULT 'active',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT lxp_course_disciplines_period_code_uk UNIQUE (course_period_id, code),
  CONSTRAINT lxp_course_disciplines_workload_check CHECK (workload >= 0),
  CONSTRAINT lxp_course_disciplines_credits_check CHECK (credits >= 0),
  CONSTRAINT lxp_course_disciplines_status_check CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX IF NOT EXISTS lxp_course_disciplines_period_id_idx
  ON public.lxp_course_disciplines (course_period_id);

-- ---------- 3) Vínculos disciplina <-> biblioteca externa ----------
-- Flexível: a UI hoje trata trail vs module; schema permite ambos.

CREATE TABLE IF NOT EXISTS public.lxp_course_library_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_discipline_id uuid NOT NULL REFERENCES public.lxp_course_disciplines(id) ON DELETE CASCADE,

  library_content_type text NOT NULL, -- 'trail' | 'module'
  library_content_id text NOT NULL,   -- id retornado pela B42
  library_content_name text,          -- opcional (ajuda no backoffice)
  metadata jsonb,                     -- flexível: tags/duração/descrição etc.

  linked_at timestamptz NOT NULL DEFAULT now(),
  linked_by uuid REFERENCES auth.users(id), -- quem vinculou (opcional)

  CONSTRAINT lxp_course_library_links_type_check CHECK (library_content_type IN ('trail', 'module')),
  CONSTRAINT lxp_course_library_links_discipline_content_uk
    UNIQUE (course_discipline_id, library_content_type, library_content_id)
);

CREATE INDEX IF NOT EXISTS lxp_course_library_links_discipline_id_idx
  ON public.lxp_course_library_links (course_discipline_id);

-- ---------- 4) Progresso do aluno por disciplina (recomendado para alinhar a UI do LXP) ----------

CREATE TABLE IF NOT EXISTS public.lxp_student_discipline_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.lxp_profiles(id) ON DELETE CASCADE,
  course_discipline_id uuid NOT NULL REFERENCES public.lxp_course_disciplines(id) ON DELETE CASCADE,

  -- status alinhado ao mock/UI:
  --   approved | in_progress | pending | failed
  status text NOT NULL DEFAULT 'pending',

  -- nota/grade (quando existir)
  grade numeric(5,2),

  -- campos extras para evolução (nullable/flexível)
  xp_earned integer,
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT lxp_student_discipline_progress_student_discipline_uk
    UNIQUE (student_profile_id, course_discipline_id),

  CONSTRAINT lxp_student_discipline_progress_status_check
    CHECK (status IN ('approved', 'in_progress', 'pending', 'failed')),

  CONSTRAINT lxp_student_discipline_progress_grade_check
    CHECK (grade IS NULL OR (grade >= 0 AND grade <= 10))
);

CREATE INDEX IF NOT EXISTS lxp_student_discipline_progress_student_id_idx
  ON public.lxp_student_discipline_progress (student_profile_id);

CREATE INDEX IF NOT EXISTS lxp_student_discipline_progress_discipline_id_idx
  ON public.lxp_student_discipline_progress (course_discipline_id);

-- ============================================
-- FIM — SEM RLS
-- ============================================

