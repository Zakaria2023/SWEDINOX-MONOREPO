"use client";

import { VisitReportInput } from "@/app/(dashboard)/companies/actions";
import {
  VISIT_REPORT_CONTACT_METHOD_LABELS,
  VISIT_REPORT_REASON_LABELS,
} from "@/lib/labels";
import { ClipboardList, Pencil, Plus, X } from "lucide-react";

type Props = {
  visitReports: VisitReportInput[];
  removeVisitReport: (index: number) => void;
  handleOpenVisitReport: () => void;
  handleEditVisitReport: (index: number) => void;
  isPending: boolean;
};

export const VisitReportsSection = ({
  visitReports,
  removeVisitReport,
  handleOpenVisitReport,
  handleEditVisitReport,
  isPending,
}: Props) => (
  <section className="space-y-4">
    <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
      Visit Reports
    </h2>
    <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
      {visitReports.map((report, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <ClipboardList className="size-4 shrink-0 text-muted-foreground" />
            <span className="shrink-0 text-muted-foreground">
              {[report.visitDate, report.visitTime].filter(Boolean).join(" ") ||
                "Visit report"}
            </span>
            {report.contactMethod && (
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {VISIT_REPORT_CONTACT_METHOD_LABELS[report.contactMethod]}
              </span>
            )}
            {report.visitReason && (
              <span className="truncate text-muted-foreground">
                {VISIT_REPORT_REASON_LABELS[report.visitReason]}
              </span>
            )}
            {report.representative && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {report.representative}
              </span>
            )}
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              0 days in system
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => handleEditVisitReport(index)}
              className="text-muted-foreground hover:text-primary"
              disabled={isPending}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit visit report</span>
            </button>
            <button
              type="button"
              onClick={() => removeVisitReport(index)}
              className="text-muted-foreground hover:text-destructive"
              disabled={isPending}
            >
              <X className="size-4" />
              <span className="sr-only">Remove visit report</span>
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleOpenVisitReport}
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        disabled={isPending}
      >
        <Plus className="size-4" />
        Add Visit Report
      </button>
    </div>
  </section>
);
