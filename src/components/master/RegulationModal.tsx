"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Checkbox } from "@/components/ui/FormField";
import { apiPatch, apiPost, ApiError } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import type { RegulationDTO } from "@/types";

interface RegulationModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  regulation?: RegulationDTO | null;
}

interface FormState {
  code: string;
  name: string;
  isActive: boolean;
}

const EMPTY: FormState = { code: "", name: "", isActive: true };

export function RegulationModal({ open, onClose, onSaved, regulation }: RegulationModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const isEdit = Boolean(regulation);

  useEffect(() => {
    if (open) {
      setForm(
        regulation
          ? { code: regulation.code, name: regulation.name ?? "", isActive: regulation.isActive }
          : EMPTY,
      );
      setErrors({});
    }
  }, [open, regulation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (isEdit && regulation) {
        await apiPatch(`/api/regulations/${regulation._id}`, form);
        toast.success("Regulation updated");
      } else {
        await apiPost("/api/regulations", form);
        toast.success("Regulation created");
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
      toast.error(err instanceof Error ? err.message : "Failed to save regulation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Regulation" : "Add Regulation"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? "Save Changes" : "Create Regulation"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldWrapper label="Regulation Code" htmlFor="reg-code" required error={errors.code} hint="e.g. R-2024">
          <Input
            id="reg-code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            error={Boolean(errors.code)}
            placeholder="R-2024"
            required
          />
        </FieldWrapper>
        <FieldWrapper label="Description (optional)" htmlFor="reg-name" error={errors.name}>
          <Input
            id="reg-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Regulation 2024"
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
