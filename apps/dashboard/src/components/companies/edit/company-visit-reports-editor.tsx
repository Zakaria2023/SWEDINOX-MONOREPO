"use client";

import {
  deleteVisitReport,
  saveVisitReport,
} from "@/app/(dashboard)/companies/[uuid]/edit/visit-reports/actions";
import { visitReportRowToDialogValues } from "@/app/(dashboard)/companies/[uuid]/edit/visit-reports/mappers";
import {
  DEFAULT_VISIT_REPORT,
  visitReportDialogSchema,
  VisitReportDialogValues,
} from "@/app/(dashboard)/companies/validation";
import { VisitReportDialog } from "@/components/companies/dialogs/visit-report-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { SelectVisitReports } from "@/db/schema/visit-reports";
import { daysInSystem, pluralize, visitReasonsLabel } from "@/lib/helpers";
import { VISIT_REPORT_CONTACT_METHOD_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { RowAction } from "@/components/ui/row-action";

type ContactSelectOption = {
  value: string;
  label: string;
};

type Props = {
  companyUuid: string;
  visitReports: SelectVisitReports[];
  contactOptions: ContactSelectOption[];
};

export const CompanyVisitReportsEditor = ({
  companyUuid,
  visitReports,
  contactOptions,
}: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SelectVisitReports | null>(
    null,
  );

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveVisitReport,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteVisitReport,
    {},
  );

  const visitReportForm = useForm<VisitReportDialogValues>({
    resolver: zodResolver(visitReportDialogSchema),
    defaultValues: DEFAULT_VISIT_REPORT,
  });

  useEffect(() => {
    if (saveState.success) {
      setIsDialogOpen(false);
      setEditingUuid(null);
      visitReportForm.reset(DEFAULT_VISIT_REPORT);
    }
  }, [saveState, visitReportForm]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  const handleOpenAdd = () => {
    // When exactly one contact exists it becomes the default; with none the
    // field stays empty (the dialog disables it and prompts to add a contact).
    visitReportForm.reset({
      ...DEFAULT_VISIT_REPORT,
      contactIndex: contactOptions.length === 1 ? contactOptions[0].value : "",
    });
    setEditingUuid(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (report: SelectVisitReports) => {
    visitReportForm.reset(visitReportRowToDialogValues(report));
    setEditingUuid(report.uuid);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      visitReportForm.reset(DEFAULT_VISIT_REPORT);
      setEditingUuid(null);
    }
    setIsDialogOpen(open);
  };

  const handleCancel = () => {
    handleDialogOpenChange(false);
  };

  const handleSave = visitReportForm.handleSubmit((values) => {
    startTransition(() => {
      dispatchSave({ companyUuid, visitReportUuid: editingUuid, values });
    });
  });

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      startTransition(() => {
        dispatchDelete({ companyUuid, visitReportUuid: deleteTarget.uuid });
      });
    }
  };

  return (
    <div className="space-y-4">
      <FormError>{saveState.error ?? deleteState.error}</FormError>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {visitReports.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No visit reports yet — add the first one below.
          </p>
        )}
        {visitReports.map((report) => {
          const days = daysInSystem(report.createdAt);

          return (
            <div
              key={report.uuid}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <ClipboardList className="size-4 shrink-0 text-muted-foreground" />
                <span className="shrink-0 text-muted-foreground">
                  {[report.visitDate, report.visitTime]
                    .filter(Boolean)
                    .join(" ") || "Visit report"}
                </span>
                {report.contactMethod && (
                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    {VISIT_REPORT_CONTACT_METHOD_LABELS[report.contactMethod]}
                  </span>
                )}
                {visitReasonsLabel(report.visitReasons) && (
                  <span className="line-clamp-1 text-muted-foreground">
                    {visitReasonsLabel(report.visitReasons)}
                  </span>
                )}
                {report.representative && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {report.representative}
                  </span>
                )}
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {days} {pluralize(days, "day")} in system
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <RowAction
                  onClick={() => handleOpenEdit(report)}
                  label="Edit visit report"
                  tone="edit"
                  disabled={isSaving || isDeleting}
                >
                  <Pencil className="size-4" />
                </RowAction>
                <RowAction
                  onClick={() => setDeleteTarget(report)}
                  label="Delete visit report"
                  tone="danger"
                  disabled={isSaving || isDeleting}
                >
                  <Trash2 className="size-4" />
                </RowAction>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          disabled={isSaving || isDeleting}
        >
          <Plus className="size-4" />
          Add Visit Report
        </button>
      </div>

      <VisitReportDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onCancel={handleCancel}
        onSave={handleSave}
        form={visitReportForm}
        contactOptions={contactOptions}
        isEditing={editingUuid !== null}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete visit report"
        description={`Delete the visit report${
          deleteTarget?.visitDate ? ` from ${deleteTarget.visitDate}` : ""
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
