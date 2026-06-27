/** Pure helpers for student course progress — shared across admin services and UI. */

export type DisciplineProgressStatusValue = "pending" | "in_progress" | "approved" | "failed" | string

export function clampProgressPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

/**
 * Course enrollment progress: approved disciplines / total disciplines in scope.
 * When `linkedDisciplineIds` is provided, only those count (matches student portal).
 */
export function courseProgressFromDisciplineStatuses(
  disciplineIds: string[],
  statusForDiscipline: (disciplineId: string) => DisciplineProgressStatusValue,
  linkedDisciplineIds?: Set<string>,
): number {
  const scope =
    linkedDisciplineIds && linkedDisciplineIds.size > 0
      ? disciplineIds.filter((id) => linkedDisciplineIds.has(id))
      : disciplineIds

  if (scope.length === 0) return 0

  let complete = 0
  for (const id of scope) {
    if (statusForDiscipline(id) === "approved") complete += 1
  }

  return clampProgressPercent((complete / scope.length) * 100)
}

export function averageEnrollmentProgress(progressValues: number[]): number {
  if (progressValues.length === 0) return 0
  const sum = progressValues.reduce((acc, value) => acc + value, 0)
  return clampProgressPercent(sum / progressValues.length)
}

export function progressLookupKey(studentProfileId: string, courseDisciplineId: string): string {
  return `${studentProfileId}:${courseDisciplineId}`
}
