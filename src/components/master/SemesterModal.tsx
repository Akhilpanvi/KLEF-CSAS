"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Checkbox } from "@/components/ui/FormField";
import { apiPatch, apiPost, ApiError } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import type { SemesterDTO } from "@/types";

interface SemesterModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  semester?: SemesterDTO | null;
}

interface FormState {
  number: string;
  name: string;
  isActive: boolean;
}

const EMPTY: FormState = { number: "", name: "", isActive: true };

export function SemesterModal({ open, onClose, onSaved, semester }: SemesterModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const isEdit = Boolean(semester);

  useEffect(() => {
    if (open) {
      setForm(
        semester
          ? { number: String(semester.number), name: semester.name, isActive: semester.isActive }
          : EMPTY,
      );
      setErrors({});
    }
  }, [open, semester]);

  function handleNumberChange(value: string) {
    setForm((prev) => ({
      ...prev,
      number: value,
      name: prev.name && prev.name !== `Semester ${prev.number}` ? prev.name : (value ? `Semester ${value}` : ""),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = { number: Number(form.number), name: form.name, isActive: form.isActive };
      if (isEdit && semester) {
        await apiPatch(`/api/semesters/${semester._id}`, payload);
        toast.success("Semester updated");
      } else {
        await apiPost("/api/semesters", payload);
        toast.success("Semester created");
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
      toast.error(err instanceof Error ? err.message : "Failed to save semester");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Semester" : "Add Semester"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? "Save Changes" : "Create Semester"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldWrapper label="Semester Number" htmlFor="sem-number" required error={errors.number} hint="e.g. 1, 2, 3...">
          <Input
            id="sem-number"
            type="number"
            min={1}
            max={20}
            value={form.number}
            onChange={(e) => handleNumberChange(e.target.value)}
            error={Boolean(errors.number)}
            required
          />
        </FieldWrapper>
        <FieldWrapper label="Semester Name" htmlFor="sem-name" required error={errors.name}>
          <Input
            id="sem-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={Boolean(errors.name)}
            placeholder="Semester 1"
            required
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
