"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import type { PaginatedResult } from "@/types";

export function useMasterList<T>(endpoint: string, params: Record<string, string | undefined>) {
  const [data, setData] = useState<PaginatedResult<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) query.set(k, v);
  const qs = query.toString();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet<PaginatedResult<T>>(`${endpoint}${qs ? `?${qs}` : ""}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [endpoint, qs]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
