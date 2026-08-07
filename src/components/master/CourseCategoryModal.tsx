"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Textarea, Checkbox } from "@/components/ui/FormField";
import { apiPatch, apiPost, ApiError } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import type { CourseCategoryDTO } from "@/types";

interface CourseCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  category?: CourseCategoryDTO | null;
}

interface FormState {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

const EMPTY: FormState = { code: "", name: "", description: "", isActive: true };

export function CourseCategoryModal({ open, onClose, onSaved, category }: CourseCategoryModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const isEdit = Boolean(category);

  useEffect(() => {
    if (open) {
      setForm(
        category
          ? {
              code: category.code,
              name: category.name,
              description: category.description ?? "",
              isActive: category.isActive,
            }
          : EMPTY,
      );
      setErrors({});
    }
  }, [open, category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (isEdit && category) {
        await apiPatch(`/api/course-categories/${category._id}`, form);
        toast.success("Course category updated");
      } else {
        await apiPost("/api/course-categories", form);
        toast.success("Course category created");
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
      toast.error(err instanceof Error ? err.message : "Failed to save course category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Course Category" : "Add Course Category"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? "Save Changes" : "Create Category"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldWrapper label="Category Code" htmlFor="cat-code" required error={errors.code} hint="e.g. PEC-4, OE-1, BSC, AUC">
          <Input
            id="cat-code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            error={Boolean(errors.code)}
            placeholder="PEC-4"
            required
          />
        </FieldWrapper>
        <FieldWrapper label="Category Name" htmlFor="cat-name" required error={errors.name}>
          <Input
            id="cat-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={Boolean(errors.name)}
            placeholder="Professional Elective 4"
            required
          />
        </FieldWrapper>
        <FieldWrapper label="Description" htmlFor="cat-desc" error={errors.description}>
          <Textarea
            id="cat-desc"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FieldWrapper>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <Checkbox checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Active
        </label>
      </form>
    </Modal>
  );
}
