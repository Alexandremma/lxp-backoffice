import { describe, expect, it } from "vitest"
import { can, canAll, canAny } from "@/consts/permissions"

describe("permissions.can", () => {
  it("returns false for null/undefined role", () => {
    expect(can(null, "dashboard.visualizar")).toBe(false)
    expect(can(undefined, "cursos.editar")).toBe(false)
  })

  it("allows admin every permission id", () => {
    expect(can("admin", "configuracoes.editar")).toBe(true)
    expect(can("admin", "equipe.excluir")).toBe(true)
    expect(can("admin", "cursos.excluir")).toBe(true)
  })

  it("matches coordinator matrix (cursos CRUD, no settings)", () => {
    expect(can("coordinator", "cursos.criar")).toBe(true)
    expect(can("coordinator", "cursos.excluir")).toBe(true)
    expect(can("coordinator", "alunos.criar")).toBe(true)
    expect(can("coordinator", "configuracoes.editar")).toBe(false)
    expect(can("coordinator", "equipe.excluir")).toBe(false)
    expect(can("coordinator", "certificados.template_editar")).toBe(false)
  })

  it("matches professor matrix (course edit, no student CRUD)", () => {
    expect(can("professor", "cursos.criar")).toBe(true)
    expect(can("professor", "cursos.editar")).toBe(true)
    expect(can("professor", "cursos.excluir")).toBe(false)
    expect(can("professor", "matriculas.criar")).toBe(true)
    expect(can("professor", "alunos.criar")).toBe(false)
    expect(can("professor", "certificados.emitir")).toBe(true)
    expect(can("professor", "gamificacao.xp_editar")).toBe(false)
  })
})

describe("permissions.canAny / canAll", () => {
  it("canAny is true when at least one permission matches", () => {
    expect(canAny("professor", ["alunos.criar", "cursos.editar"])).toBe(true)
    expect(canAny("professor", ["alunos.criar", "configuracoes.editar"])).toBe(false)
  })

  it("canAll requires every permission", () => {
    expect(canAll("coordinator", ["cursos.criar", "cursos.excluir"])).toBe(true)
    expect(canAll("professor", ["cursos.criar", "cursos.excluir"])).toBe(false)
  })
})
