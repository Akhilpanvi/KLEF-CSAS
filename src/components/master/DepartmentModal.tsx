"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Textarea, Checkbox } from "@/components/ui/FormField";
import { apiPatch, apiPost, ApiError } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import type { DepartmentDTO } from "@/types";

interface DepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  department?: DepartmentDTO | null;
}

interface FormState {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

const EMPTY: FormState = { code: "", name: "", description: "", isActive: true };

export function DepartmentModal({ open, onClose, onSaved, department }: DepartmentModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const isEdit = Boolean(department);

  useEffect(() => {
    if (open) {
      setForm(
        department
          ? {
              code: department.code,
              name: department.name,
              description: department.description ?? "",
              isActive: department.isActive,
            }
          : EMPTY,
      );
      setErrors({});
    }
  }, [open, department]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (isEdit && department) {
        await apiPatch(`/api/departments/${department._id}`, form);
        toast.success("Department updated");
      } else {
        await apiPost("/api/departments", form);
        toast.success("Department created");
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
      toast.error(err instanceof Error ? err.message : "Failed to save department");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Department" : "Add Department"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? "Save Changes" : "Create Department"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldWrapper label="Department Code" htmlFor="dept-code" required error={errors.code} hint="e.g. CSE, CSIT, AIDS, ECE">
          <Input
            id="dept-code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            error={Boolean(errors.code)}
            placeholder="CSE"
            required
          />
        </FieldWrapper>
        <FieldWrapper label="Department Name" htmlFor="dept-name" required error={errors.name}>
          <Input
            id="dept-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={Boolean(errors.name)}
            placeholder="Computer Science and Engineering"
            required
          />
        </FieldWrapper>
        <FieldWrapper label="Description" htmlFor="dept-desc" error={errors.description}>
          <Textarea
            id="dept-desc"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FieldWrapper>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <Checkbox checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Active
        </label>
      </form>
    </Modal>
  );
}
