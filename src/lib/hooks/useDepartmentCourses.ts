"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import type { AvailableCourseDTO } from "@/types";

export function useDepartmentCourses(filters: Record<string, string | undefined>) {
  const [items, setItems] = useState<AvailableCourseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) query.set(k, v);
  const qs = query.toString();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ items: AvailableCourseDTO[] }>(`/api/department/courses${qs ? `?${qs}` : ""}`);
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, loading, error, refetch };
}
