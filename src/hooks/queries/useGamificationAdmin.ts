import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/consts/queryKeys"
import {
  getBadgeEarnedCountsAdmin,
  listBadgesAdmin,
  listLevelsAdmin,
  listXpRulesAdmin,
} from "@/services/gamificationAdminService"

export function useGamificationXpRulesAdmin() {
  return useQuery({ queryKey: queryKeys.gamification.xpRules, queryFn: listXpRulesAdmin, retry: 1 })
}

export function useGamificationLevelsAdmin() {
  return useQuery({ queryKey: queryKeys.gamification.levels, queryFn: listLevelsAdmin, retry: 1 })
}

export function useGamificationBadgesAdmin() {
  return useQuery({ queryKey: queryKeys.gamification.badges, queryFn: listBadgesAdmin, retry: 1 })
}

export function useBadgeEarnedCountsAdmin() {
  return useQuery({
    queryKey: queryKeys.gamification.badgeEarnedCounts,
    queryFn: getBadgeEarnedCountsAdmin,
    retry: 1,
  })
}
