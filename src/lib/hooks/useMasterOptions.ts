"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import type {
  DepartmentDTO,
  CourseCategoryDTO,
  RegulationDTO,
  SemesterDTO,
  CourseTypeDTO,
  PaginatedResult,
} from "@/types";

export interface MasterOptions {
  departments: DepartmentDTO[];
  categories: CourseCategoryDTO[];
  regulations: RegulationDTO[];
  semesters: SemesterDTO[];
  courseTypes: CourseTypeDTO[];
  loading: boolean;
  refetch: () => void;
  refetchCourseTypes: () => void;
}

async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const res = await apiGet<PaginatedResult<T>>(`${endpoint}?status=all&pageSize=500`);
  return res.items;
}

export function useMasterOptions(): MasterOptions {
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [categories, setCategories] = useState<CourseCategoryDTO[]>([]);
  const [regulations, setRegulations] = useState<RegulationDTO[]>([]);
  const [semesters, setSemesters] = useState<SemesterDTO[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseTypeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [d, c, r, s, ct] = await Promise.all([
        fetchAll<DepartmentDTO>("/api/departments"),
        fetchAll<CourseCategoryDTO>("/api/course-categories"),
        fetchAll<RegulationDTO>("/api/regulations"),
        fetchAll<SemesterDTO>("/api/semesters"),
        fetchAll<CourseTypeDTO>("/api/course-types"),
      ]);
      setDepartments(d);
      setCategories(c);
      setRegulations(r);
      setSemesters(s.sort((a, b) => a.number - b.number));
      setCourseTypes(ct);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchCourseTypes = useCallback(() => {
    fetchAll<CourseTypeDTO>("/api/course-types").then(setCourseTypes);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return { departments, categories, regulations, semesters, courseTypes, loading, refetch: loadAll, refetchCourseTypes };
}
