import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getLibraryContent } from "@/services/libraryAdapter"
import type { SearchLibraryResponse } from "@/types/library"

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

export function useSearchLibraryContent(params: {
  q?: string
  page?: number
  pageSize?: number
}) {
  const { q = "", page = 1, pageSize = 20 } = params
  const debouncedQ = useDebouncedValue(q, 300)
  const key = useMemo(() => ["library", "search", { q: debouncedQ, page, pageSize }] as const, [debouncedQ, page, pageSize])

  const query = useQuery<SearchLibraryResponse>({
    queryKey: key,
    queryFn: () => getLibraryContent({ q: debouncedQ, page, pageSize }),
    keepPreviousData: true,
  })

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    catalogSource: query.data?.catalogSource,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  }
}

