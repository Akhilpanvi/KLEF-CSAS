import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CourseStatusBadge } from "@/components/ui/Badge";
import type { CourseDTO, DepartmentDTO } from "@/types";

function label(value: { code?: string; name?: string } | string | undefined): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value.code ? `${value.code}${value.name ? ` — ${value.name}` : ""}` : value.name ?? "—";
}

function Field({ label: l, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{l}</p>
      <p className="text-sm text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}

export function CourseDetailsModal({
  open,
  onClose,
  course,
}: {
  open: boolean;
  onClose: () => void;
  course: CourseDTO | null;
}) {
  if (!course) return null;

  const offeredTo = course.offeredToDepartments as (DepartmentDTO | string)[];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${course.courseCode} — ${course.courseName}`}
      size="lg"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <CourseStatusBadge status={course.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Regulation" value={label(course.regulation)} />
          <Field label="Semester" value={label(course.semester)} />
          <Field label="Course Category" value={label(course.courseCategory)} />
          <Field label="Course Type" value={label(course.courseType)} />
          <Field label="Credits" value={course.credits} />
          <Field label="Contact Hours" value={course.contactHours} />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Field label="L" value={course.L} />
          <Field label="T" value={course.T} />
          <Field label="P" value={course.P} />
          <Field label="S" value={course.S} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Offered By" value={label(course.offeredByDepartment)} />
          <Field
            label="Offered To"
            value={
              <div className="flex flex-wrap gap-1 mt-1">
                {offeredTo.map((d, i) => (
                  <span key={i} className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {label(d)}
                  </span>
                ))}
              </div>
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Course Coordinator" value={course.courseCoordinatorName} />
          <Field label="Employee ID" value={course.courseCoordinatorEmployeeId} />
        </div>
      </div>
    </Modal>
  );
}
