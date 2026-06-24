"use client";

import { VisitReportListItem } from "@/app/(dashboard)/visit-reports/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { COMMON_TEXT, VISIT_REPORT_CONTACT_METHOD_LABELS } from "@/lib/labels";
import { useState } from "react";

type ColumnKey =
  | "id"
  | "companyName"
  | "representative"
  | "visitedBy"
  | "contactMethod"
  | "visitDate"
  | "visitTime"
  | "hasTakenPlace"
  | "visitReason"
  | "contactUuid"
  | "city"
  | "postalCode"
  | "telephone"
  | "fax"
  | "address"
  | "attentionPoint"
  | "remarks"
  | "createdAt";

const ALL_COLUMNS: Array<{
  defaultVisible: boolean;
  key: ColumnKey;
  label: string;
}> = [
  { key: "id", label: "ID", defaultVisible: true },
  { key: "companyName", label: "Company", defaultVisible: true },
  { key: "visitedBy", label: "Visited By", defaultVisible: true },
  { key: "contactMethod", label: "Contact Method", defaultVisible: true },
  { key: "visitDate", label: "Visit Date", defaultVisible: true },
  { key: "hasTakenPlace", label: "Happened", defaultVisible: true },
  { key: "visitReason", label: "Visit Reason", defaultVisible: true },
  { key: "representative", label: "Representative", defaultVisible: false },
  { key: "visitTime", label: "Visit Time", defaultVisible: false },
  { key: "contactUuid", label: "Contact", defaultVisible: false },
  { key: "city", label: "City", defaultVisible: false },
  { key: "postalCode", label: "Postal Code", defaultVisible: false },
  { key: "telephone", label: "Telephone", defaultVisible: false },
  { key: "fax", label: "Fax", defaultVisible: false },
  { key: "address", label: "Address", defaultVisible: false },
  { key: "attentionPoint", label: "Attention Point", defaultVisible: false },
  { key: "remarks", label: "Remarks", defaultVisible: false },
  { key: "createdAt", label: "Created At", defaultVisible: false },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, column) => ({ ...acc, [column.key]: column.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type VisitReportsTableContentProps = {
  visitReports: VisitReportListItem[];
};

export const VisitReportsTableContent = ({
  visitReports,
}: VisitReportsTableContentProps) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter(
    (column) => columnVisibility[column.key],
  );
  const fallbackValue = COMMON_TEXT.notAvailable;

  const renderCell = (visitReport: VisitReportListItem, key: ColumnKey) => {
    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            {visitReport.id}
          </TableCell>
        );
      case "companyName":
        return (
          <TableCell key={key} className="font-medium">
            {visitReport.companyName}
          </TableCell>
        );
      case "representative":
        return (
          <TableCell key={key}>
            {visitReport.representative ?? fallbackValue}
          </TableCell>
        );
      case "visitedBy":
        return (
          <TableCell key={key}>
            {visitReport.visitedBy ?? fallbackValue}
          </TableCell>
        );
      case "contactMethod":
        return (
          <TableCell key={key}>
            {visitReport.contactMethod
              ? VISIT_REPORT_CONTACT_METHOD_LABELS[visitReport.contactMethod]
              : fallbackValue}
          </TableCell>
        );
      case "visitDate":
        return (
          <TableCell key={key}>
            {visitReport.visitDate ?? fallbackValue}
          </TableCell>
        );
      case "visitTime":
        return (
          <TableCell key={key}>
            {visitReport.visitTime ?? fallbackValue}
          </TableCell>
        );
      case "hasTakenPlace":
        return (
          <TableCell key={key}>
            {visitReport.hasTakenPlace ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                {COMMON_TEXT.yes}
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {COMMON_TEXT.no}
              </span>
            )}
          </TableCell>
        );
      case "visitReason":
        return (
          <TableCell key={key}>
            {visitReport.visitReason ?? fallbackValue}
          </TableCell>
        );
      case "contactUuid":
        return (
          <TableCell key={key}>
            {visitReport.contactUuid ?? fallbackValue}
          </TableCell>
        );
      case "city":
        return (
          <TableCell key={key}>{visitReport.city ?? fallbackValue}</TableCell>
        );
      case "postalCode":
        return (
          <TableCell key={key}>
            {visitReport.postalCode ?? fallbackValue}
          </TableCell>
        );
      case "telephone":
        return (
          <TableCell key={key}>
            {visitReport.telephone ?? fallbackValue}
          </TableCell>
        );
      case "fax":
        return (
          <TableCell key={key}>{visitReport.fax ?? fallbackValue}</TableCell>
        );
      case "address":
        return (
          <TableCell key={key}>
            {visitReport.address ?? fallbackValue}
          </TableCell>
        );
      case "attentionPoint":
        return (
          <TableCell key={key}>
            {visitReport.attentionPoint ?? fallbackValue}
          </TableCell>
        );
      case "remarks":
        return (
          <TableCell key={key}>
            {visitReport.remarks ?? fallbackValue}
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(visitReport.createdAt).toLocaleDateString()}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ColumnSelector
          columns={ALL_COLUMNS.map((column) => ({
            key: column.key,
            label: column.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitReports.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No visit reports found
                </TableCell>
              </TableRow>
            ) : (
              visitReports.map((visitReport) => (
                <TableRow key={visitReport.uuid}>
                  {visibleColumns.map((column) =>
                    renderCell(visitReport, column.key),
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
