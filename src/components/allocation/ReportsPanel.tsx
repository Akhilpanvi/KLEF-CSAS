"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

const REPORT_TYPES: { type: string; label: string }[] = [
  { type: "course", label: "Course-wise" },
  { type: "category", label: "Category-wise" },
  { type: "department", label: "Department-wise" },
  { type: "allocation", label: "Allocation Detail" },
  { type: "section", label: "Section-wise" },
  { type: "cluster", label: "Cluster summary" },
];

export function ReportsPanel({ groupId }: { groupId: string }) {
  async function download(type: string) {
    const res = await fetch(`/api/allocation/groups/${groupId}/reports?type=${type}&format=xlsx`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type}_report.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {REPORT_TYPES.map((r) => (
        <Button key={r.type} variant="secondary" size="sm" onClick={() => download(r.type)}>
          <Download size={13} /> {r.label}
        </Button>
      ))}
    </div>
  );
}
