"use client";

import { DemandListPage } from "@/components/demand/DemandListPage";

export default function CourseDemandPage() {
  return (
    <DemandListPage
      title="Course Demand"
      description="Enter and track your department's student demand for each course."
      showStatusFilter
    />
  );
}
