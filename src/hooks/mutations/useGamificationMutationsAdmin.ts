import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import {
  createBadgeAdmin,
  deleteBadgeAdmin,
  deleteLevelByNumberAdmin,
  reevaluateAllStudentBadgesAdmin,
  updateBadgeAdmin,
  updateXpRuleAdmin,
  upsertLevelAdmin,
} from "@/services/gamificationAdminService"

function invalidateGamification(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: queryKeys.gamification.xpRules })
  void qc.invalidateQueries({ queryKey: queryKeys.gamification.levels })
  void qc.invalidateQueries({ queryKey: queryKeys.gamification.badges })
  void qc.invalidateQueries({ queryKey: queryKeys.gamification.badgeEarnedCounts })
}

export function useUpdateXpRuleAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; patch: Parameters<typeof updateXpRuleAdmin>[1] }) =>
      updateXpRuleAdmin(args.id, args.patch),
    onSuccess: () => invalidateGamification(qc),
  })
}

export function useUpsertLevelAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof upsertLevelAdmin>[0]) => upsertLevelAdmin(input),
    onSuccess: () => invalidateGamification(qc),
  })
}

export function useDeleteLevelAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (levelNumber: number) => deleteLevelByNumberAdmin(levelNumber),
    onSuccess: () => invalidateGamification(qc),
  })
}

export function useCreateBadgeAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof createBadgeAdmin>[0]) => createBadgeAdmin(input),
    onSuccess: () => invalidateGamification(qc),
  })
}

export function useUpdateBadgeAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; patch: Parameters<typeof updateBadgeAdmin>[1] }) =>
      updateBadgeAdmin(args.id, args.patch),
    onSuccess: () => invalidateGamification(qc),
  })
}

export function useDeleteBadgeAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBadgeAdmin(id),
    onSuccess: () => invalidateGamification(qc),
  })
}

export function useReevaluateAllBadgesAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => reevaluateAllStudentBadgesAdmin(),
    onSuccess: () => invalidateGamification(qc),
  })
}
