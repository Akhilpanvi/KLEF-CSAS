"use client";

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select, Checkbox } from "@/components/ui/FormField";
import { CourseTypeManagerModal } from "@/components/master/CourseTypeManagerModal";
import { apiPatch, apiPost, ApiError } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import { useMasterOptions } from "@/lib/hooks/useMasterOptions";
import type { CourseDTO } from "@/types";

interface CourseFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  course?: CourseDTO | null;
  /** Department-scoped Module 1: Offered By is fixed to the logged-in department, never client-selectable. */
  fixedOfferedBy?: { id: string; code: string };
}

interface FormState {
  regulation: string;
  semester: string;
  courseCode: string;
  courseName: string;
  courseCategory: string;
  L: string;
  T: string;
  P: string;
  S: string;
  contactHours: string;
  credits: string;
  courseType: string;
  offeredByDepartment: string;
  offeredToDepartments: string[];
  courseCoordinatorName: string;
  courseCoordinatorEmployeeId: string;
  status: "Active" | "Inactive" | "Archived";
}

function idOf(value: { _id: string } | string | undefined): string {
  if (!value) return "";
  return typeof value === "string" ? value : value._id;
}

function emptyForm(): FormState {
  return {
    regulation: "",
    semester: "",
    courseCode: "",
    courseName: "",
    courseCategory: "",
    L: "0",
    T: "0",
    P: "0",
    S: "0",
    contactHours: "0",
    credits: "0",
    courseType: "",
    offeredByDepartment: "",
    offeredToDepartments: [],
    courseCoordinatorName: "",
    courseCoordinatorEmployeeId: "",
    status: "Active",
  };
}

export function CourseFormModal({ open, onClose, onSaved, course, fixedOfferedBy }: CourseFormModalProps) {
  const { departments, categories, regulations, semesters, courseTypes, refetchCourseTypes } = useMasterOptions();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [manageTypesOpen, setManageTypesOpen] = useState(false);
  const toast = useToast();
  const isEdit = Boolean(course);

  useEffect(() => {
    if (!open) return;
    if (course) {
      setForm({
        regulation: idOf(course.regulation),
        semester: idOf(course.semester),
        courseCode: course.courseCode,
        courseName: course.courseName,
        courseCategory: idOf(course.courseCategory),
        L: String(course.L),
        T: String(course.T),
        P: String(course.P),
        S: String(course.S),
        contactHours: String(course.contactHours),
        credits: String(course.credits),
        courseType: idOf(course.courseType),
        offeredByDepartment: idOf(course.offeredByDepartment),
        offeredToDepartments: course.offeredToDepartments.map((d) => idOf(d)),
        courseCoordinatorName: course.courseCoordinatorName,
        courseCoordinatorEmployeeId: course.courseCoordinatorEmployeeId,
        status: course.status,
      });
    } else {
      setForm({ ...emptyForm(), offeredByDepartment: fixedOfferedBy?.id ?? "" });
    }
    setErrors({});
  }, [open, course, fixedOfferedBy]);

  function toggleOfferedTo(id: string) {
    setForm((prev) => ({
      ...prev,
      offeredToDepartments: prev.offeredToDepartments.includes(id)
        ? prev.offeredToDepartments.filter((x) => x !== id)
        : [...prev.offeredToDepartments, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        ...form,
        L: Number(form.L),
        T: Number(form.T),
        P: Number(form.P),
        S: Number(form.S),
        contactHours: Number(form.contactHours),
        credits: Number(form.credits),
      };
      if (isEdit && course) {
        await apiPatch(`/api/courses/${course._id}`, payload);
        toast.success("Course updated");
      } else {
        await apiPost("/api/courses", payload);
        toast.success("Course created");
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.details && typeof err.details === "object") {
        const fieldErrors = (err.details as { fieldErrors?: Record<string, string[]> }).fieldErrors;
        if (fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(fieldErrors)) if (v?.[0]) flat[k] = v[0];
          setErrors(flat);
        }
      }
      toast.error(err instanceof Error ? err.message : "Failed to save course");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? "Edit Course" : "Add Course"}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              {isEdit ? "Save Changes" : "Create Course"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Regulation" htmlFor="c-reg" required error={errors.regulation}>
              <Select id="c-reg" value={form.regulation} onChange={(e) => setForm({ ...form, regulation: e.target.value })} required>
                <option value="">Select regulation</option>
                {regulations.map((r) => (
                  <option key={r._id} value={r._id} disabled={!r.isActive && r._id !== idOf(course?.regulation)}>
                    {r.code} {!r.isActive ? "(inactive)" : ""}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Semester" htmlFor="c-sem" required error={errors.semester}>
              <Select id="c-sem" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} required>
                <option value="">Select semester</option>
                {semesters.map((s) => (
                  <option key={s._id} value={s._id} disabled={!s.isActive && s._id !== idOf(course?.semester)}>
                    {s.name} {!s.isActive ? "(inactive)" : ""}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Course Code" htmlFor="c-code" required error={errors.courseCode}>
              <Input
                id="c-code"
                value={form.courseCode}
                onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                placeholder="23CS5101"
                required
              />
            </FieldWrapper>
            <FieldWrapper label="Course Name" htmlFor="c-name" required error={errors.courseName}>
              <Input
                id="c-name"
                value={form.courseName}
                onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                placeholder="Cloud Computing"
                required
              />
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Course Category" htmlFor="c-cat" required error={errors.courseCategory}>
              <Select id="c-cat" value={form.courseCategory} onChange={(e) => setForm({ ...form, courseCategory: e.target.value })} required>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id} disabled={!c.isActive && c._id !== idOf(course?.courseCategory)}>
                    {c.code} — {c.name} {!c.isActive ? "(inactive)" : ""}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Course Type" htmlFor="c-type" required error={errors.courseType}>
              <div className="flex gap-2">
                <Select
                  id="c-type"
                  value={form.courseType}
                  onChange={(e) => setForm({ ...form, courseType: e.target.value })}
                  required
                  className="flex-1"
                >
                  <option value="">Select type</option>
                  {courseTypes.map((t) => (
                    <option key={t._id} value={t._id} disabled={!t.isActive && t._id !== idOf(course?.courseType)}>
                      {t.name} {!t.isActive ? "(inactive)" : ""}
                    </option>
                  ))}
                </Select>
                <Button type="button" variant="secondary" size="sm" onClick={() => setManageTypesOpen(true)} title="Manage course types">
                  <Settings2 size={14} />
                </Button>
              </div>
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {(["L", "T", "P", "S"] as const).map((key) => (
              <FieldWrapper key={key} label={key} htmlFor={`c-${key}`} error={errors[key]}>
                <Input
                  id={`c-${key}`}
                  type="number"
                  min={0}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required
                />
              </FieldWrapper>
            ))}
            <FieldWrapper label="Contact Hrs" htmlFor="c-ch" error={errors.contactHours}>
              <Input
                id="c-ch"
                type="number"
                min={0}
                value={form.contactHours}
                onChange={(e) => setForm({ ...form, contactHours: e.target.value })}
                required
              />
            </FieldWrapper>
            <FieldWrapper label="Credits" htmlFor="c-credits" error={errors.credits}>
              <Input
                id="c-credits"
                type="number"
                min={0}
                step="0.5"
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: e.target.value })}
                required
              />
            </FieldWrapper>
          </div>

          <FieldWrapper label="Offered By Department" htmlFor="c-offby" required error={errors.offeredByDepartment}>
            {fixedOfferedBy ? (
              <Input id="c-offby" value={fixedOfferedBy.code} disabled />
            ) : (
              <Select
                id="c-offby"
                value={form.offeredByDepartment}
                onChange={(e) => setForm({ ...form, offeredByDepartment: e.target.value })}
                required
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id} disabled={!d.isActive && d._id !== idOf(course?.offeredByDepartment)}>
                    {d.code} — {d.name} {!d.isActive ? "(inactive)" : ""}
                  </option>
                ))}
              </Select>
            )}
          </FieldWrapper>

          <FieldWrapper
            label="Offered To Departments"
            error={errors.offeredToDepartments}
            hint="Select every department this course is offered to."
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg border border-slate-300 dark:border-slate-700 p-3">
              {departments
                .filter((d) => d._id !== (fixedOfferedBy?.id ?? idOf(course?.offeredByDepartment)))
                .map((d) => (
                  <label key={d._id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <Checkbox
                      checked={form.offeredToDepartments.includes(d._id)}
                      onChange={() => toggleOfferedTo(d._id)}
                    />
                    {d.code}
                  </label>
                ))}
              {departments.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500">No departments available.</p>}
            </div>
          </FieldWrapper>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Course Coordinator Name" htmlFor="c-coord" required error={errors.courseCoordinatorName}>
              <Input
                id="c-coord"
                value={form.courseCoordinatorName}
                onChange={(e) => setForm({ ...form, courseCoordinatorName: e.target.value })}
                placeholder="Dr Example"
                required
              />
            </FieldWrapper>
            <FieldWrapper label="Coordinator Employee ID" htmlFor="c-emp" required error={errors.courseCoordinatorEmployeeId}>
              <Input
                id="c-emp"
                value={form.courseCoordinatorEmployeeId}
                onChange={(e) => setForm({ ...form, courseCoordinatorEmployeeId: e.target.value })}
                placeholder="EMP001"
                required
              />
            </FieldWrapper>
          </div>

          {isEdit && (
            <FieldWrapper label="Status" htmlFor="c-status">
              <Select
                id="c-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as FormState["status"] })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Archived">Archived</option>
              </Select>
            </FieldWrapper>
          )}
        </form>
      </Modal>

      <CourseTypeManagerModal
        open={manageTypesOpen}
        onClose={() => setManageTypesOpen(false)}
        courseTypes={courseTypes}
        onChanged={refetchCourseTypes}
      />
    </>
  );
}
