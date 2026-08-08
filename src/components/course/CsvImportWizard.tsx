"use client";

import { useRef, useState } from "react";
import { UploadCloud, Download, FileWarning, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ErrorRowsTable } from "./ErrorRowsTable";
import { apiPostForm } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import { buildErrorReportCsv } from "@/lib/csv/errorReport";
import type { ValidationSummary, RowResult } from "@/lib/csv/validateCourseRows";

interface CsvImportWizardProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

interface ImportResult {
  totalRows: number;
  attempted: number;
  imported: number;
  skipped: number;
  failedRows: RowResult[];
}

type Step = "upload" | "preview" | "result";

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function CsvImportWizard({ open, onClose, onImported }: CsvImportWizardProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  function reset() {
    setStep("upload");
    setFile(null);
    setSummary(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleDownloadSample() {
    const res = await fetch("/api/courses/csv/sample");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "course_master_sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleValidate() {
    if (!file) return;
    setValidating(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiPostForm<ValidationSummary>("/api/courses/csv/validate", form);
      setSummary(res);
      setStep("preview");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to validate CSV");
    } finally {
      setValidating(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiPostForm<ImportResult>("/api/courses/csv/import", form);
      setResult(res);
      setStep("result");
      if (res.imported > 0) {
        toast.success(`${res.imported} course(s) imported`);
        onImported();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import CSV");
    } finally {
      setImporting(false);
    }
  }

  function handleDownloadErrors(results: RowResult[]) {
    const csv = buildErrorReportCsv(results);
    downloadCsv("course_import_errors.csv", csv);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Bulk Course Upload"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {step === "result" ? "Close" : "Cancel"}
          </Button>
          {step === "upload" && (
            <Button onClick={handleValidate} loading={validating} disabled={!file}>
              Validate CSV
            </Button>
          )}
          {step === "preview" && summary && (
            <>
              <Button variant="secondary" onClick={reset}>
                Choose Different File
              </Button>
              <Button onClick={handleImport} loading={importing} disabled={summary.validRows === 0}>
                Import {summary.validRows} Valid Row{summary.validRows === 1 ? "" : "s"}
              </Button>
            </>
          )}
        </>
      }
    >
      {step === "upload" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-4">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Need the template?</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Download a sample CSV with the expected columns and format.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleDownloadSample}>
              <Download size={14} /> Download Sample CSV
            </Button>
          </div>

          <label
            htmlFor="csv-file"
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 px-6 py-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20"
          >
            <UploadCloud size={28} className="text-slate-400 dark:text-slate-500" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {file ? <span className="font-medium text-slate-900 dark:text-slate-100">{file.name}</span> : "Click to select a CSV file"}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Columns must match the sample CSV. Multiple offered-to departments use &quot;|&quot;.</p>
            <input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      )}

      {step === "preview" && summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-center">
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summary.totalRows}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Rows</p>
            </div>
            <div className="rounded-lg border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/40 p-3 text-center">
              <p className="text-2xl font-semibold text-green-700 dark:text-green-400">{summary.validRows}</p>
              <p className="text-xs text-green-700 dark:text-green-400">Valid</p>
            </div>
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-center">
              <p className="text-2xl font-semibold text-red-700 dark:text-red-400">{summary.errorRows}</p>
              <p className="text-xs text-red-700 dark:text-red-400">Errors</p>
            </div>
          </div>

          {summary.errorRows > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileWarning size={15} className="text-red-500 dark:text-red-400" /> Rows with errors
                </p>
                <Button variant="secondary" size="sm" onClick={() => handleDownloadErrors(summary.results)}>
                  <Download size={14} /> Download Error CSV
                </Button>
              </div>
              <ErrorRowsTable results={summary.results} />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Correct the highlighted rows in your file (or the downloaded error CSV) and upload again. Only the{" "}
                {summary.validRows} valid row(s) will be imported if you continue now.
              </p>
            </div>
          )}

          {summary.errorRows === 0 && (
            <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-1.5">
              <CheckCircle2 size={16} /> All rows are valid and ready to import.
            </p>
          )}
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-center">
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{result.totalRows}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Rows</p>
            </div>
            <div className="rounded-lg border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/40 p-3 text-center">
              <p className="text-2xl font-semibold text-green-700 dark:text-green-400">{result.imported}</p>
              <p className="text-xs text-green-700 dark:text-green-400">Imported</p>
            </div>
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-center">
              <p className="text-2xl font-semibold text-red-700 dark:text-red-400">{result.skipped}</p>
              <p className="text-xs text-red-700 dark:text-red-400">Skipped</p>
            </div>
          </div>

          {result.failedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Skipped rows</p>
                <Button variant="secondary" size="sm" onClick={() => handleDownloadErrors(result.failedRows)}>
                  <Download size={14} /> Download Error CSV
                </Button>
              </div>
              <ErrorRowsTable results={result.failedRows} />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
