-- Seed homolog: dados de exemplo da instituição + departamentos padrão na equipe
-- Rodar após STEP 29–31 em homolog. Idempotente.

-- 1) Instituição de exemplo (aba Dados da Instituição)
UPDATE public.lxp_institution_settings
SET
  value = jsonb_build_object(
    'name', 'B42 Edtech',
    'cnpj', '12.345.678/0001-90',
    'contactEmail', 'contato@b42edtech.com.br',
    'phone', '(11) 4000-0000',
    'address', 'Av. Paulista, 1000 — Bela Vista, São Paulo — SP',
    'logoPath', null
  ),
  updated_at = now()
WHERE key = 'institution';

-- 2) Departamento padrão por função quando a coluna está vazia
UPDATE public.backoffice_team_members
SET
  department = 'administracao',
  updated_at = now()
WHERE role = 'admin'
  AND (department IS NULL OR trim(department) = '');

UPDATE public.backoffice_team_members
SET
  department = 'coordenacao_pedagogica',
  updated_at = now()
WHERE role = 'coordinator'
  AND (department IS NULL OR trim(department) = '');

UPDATE public.backoffice_team_members
SET
  department = 'ensino_atendimento',
  updated_at = now()
WHERE role = 'professor'
  AND (department IS NULL OR trim(department) = '');

-- Conferência rápida
SELECT key, value->>'name' AS institution_name
FROM public.lxp_institution_settings
WHERE key = 'institution';

SELECT email, role, department
FROM public.backoffice_team_members
ORDER BY created_at;
