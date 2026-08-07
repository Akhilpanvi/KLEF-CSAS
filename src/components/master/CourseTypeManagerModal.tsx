"use client";

import { useState } from "react";
import { Plus, Power } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { StatusBadge } from "@/components/ui/Badge";
import { apiPatch, apiPost } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import type { CourseTypeDTO } from "@/types";

interface CourseTypeManagerModalProps {
  open: boolean;
  onClose: () => void;
  courseTypes: CourseTypeDTO[];
  onChanged: () => void;
}

export function CourseTypeManagerModal({ open, onClose, courseTypes, onChanged }: CourseTypeManagerModalProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiPost("/api/course-types", { name: name.trim() });
      toast.success("Course type added");
      setName("");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add course type");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(ct: CourseTypeDTO) {
    try {
      await apiPatch(`/api/course-types/${ct._id}`, { isActive: !ct.isActive });
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update course type");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage Course Types" size="sm" footer={<Button onClick={onClose}>Done</Button>}>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Theory, Lab, Theory cum Lab"
          className="flex-1"
        />
        <Button type="submit" loading={saving}>
          <Plus size={14} /> Add
        </Button>
      </form>

      <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
        {courseTypes.length === 0 && <p className="text-sm text-slate-400 p-3">No course types yet.</p>}
        {courseTypes.map((ct) => (
          <div key={ct._id} className="flex items-center justify-between px-3 py-2 text-sm">
            <span className="text-slate-700">{ct.name}</span>
            <div className="flex items-center gap-2">
              <StatusBadge isActive={ct.isActive} />
              <Button variant="ghost" size="sm" onClick={() => toggle(ct)}>
                <Power size={13} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
