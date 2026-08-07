"use client";

import { DemandListPage } from "@/components/demand/DemandListPage";

export default function SubmittedDemandPage() {
  return (
    <DemandListPage
      title="Submitted"
      description="Course demand already submitted and locked."
      fixedStatus="SUBMITTED"
    />
  );
}
