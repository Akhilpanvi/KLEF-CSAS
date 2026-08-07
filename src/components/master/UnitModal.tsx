"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select as SelectField, Checkbox } from "@/components/ui/FormField";
import { apiPatch, apiPost, ApiError } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import type { UnitDTO, DepartmentDTO } from "@/types";

interface UnitModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  unit?: UnitDTO | null;
  departments: DepartmentDTO[];
}

interface FormState {
  code: string;
  name: string;
  parentDepartment: string;
  isActive: boolean;
}

function emptyForm(departments: DepartmentDTO[]): FormState {
  return { code: "", name: "", parentDepartment: departments[0]?._id ?? "", isActive: true };
}

export function UnitModal({ open, onClose, onSaved, unit, departments }: UnitModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm(departments));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const isEdit = Boolean(unit);

  useEffect(() => {
    if (open) {
      setForm(
        unit
          ? {
              code: unit.code,
              name: unit.name,
              parentDepartment: typeof unit.parentDepartment === "string" ? unit.parentDepartment : unit.parentDepartment._id,
              isActive: unit.isActive,
            }
          : emptyForm(departments),
      );
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, unit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (isEdit && unit) {
        await apiPatch(`/api/units/${unit._id}`, form);
        toast.success("Unit updated");
      } else {
        await apiPost("/api/units", form);
        toast.success("Unit created");
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
      toast.error(err instanceof Error ? err.message : "Failed to save unit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Unit" : "Add Unit"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving} disabled={departments.length === 0}>
            {isEdit ? "Save Changes" : "Create Unit"}
          </Button>
        </>
      }
    >
      {departments.length === 0 ? (
        <p className="text-sm text-slate-500">
          Add at least one parent department before creating units.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldWrapper label="Parent Department" htmlFor="unit-dept" required error={errors.parentDepartment}>
            <SelectField
              id="unit-dept"
              value={form.parentDepartment}
              onChange={(e) => setForm({ ...form, parentDepartment: e.target.value })}
              error={Boolean(errors.parentDepartment)}
              required
            >
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.code} — {d.name}
                </option>
              ))}
            </SelectField>
          </FieldWrapper>
          <FieldWrapper label="Unit Code" htmlFor="unit-code" required error={errors.code} hint="e.g. CSE-1, HTE, HTR, HTI">
            <Input
              id="unit-code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              error={Boolean(errors.code)}
              placeholder="CSE-1"
              required
            />
          </FieldWrapper>
          <FieldWrapper label="Unit Name" htmlFor="unit-name" required error={errors.name}>
            <Input
              id="unit-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={Boolean(errors.name)}
              placeholder="CSE Section 1"
              required
            />
          </FieldWrapper>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active
          </label>
        </form>
      )}
    </Modal>
  );
}
