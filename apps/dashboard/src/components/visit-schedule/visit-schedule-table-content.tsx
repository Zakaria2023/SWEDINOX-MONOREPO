"use client";

import Link from "next/link";
import { useState } from "react";
import { VisitScheduleRow } from "@/app/(dashboard)/visit-schedule/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { formatDateValue, formatRevenue } from "@/lib/helpers";

type ColumnKey = keyof VisitScheduleRow | "contactPerson";

const ALL_COLUMNS: Array<{
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}> = [
  { key: "companyCode", label: "Company Code", defaultVisible: true },
  { key: "companyName", label: "Company", defaultVisible: true },
  {
    key: "visitStreetAndNo",
    label: "Visiting Address Street",
    defaultVisible: true,
  },
  {
    key: "visitPostalCode",
    label: "Visiting Address Postal Code",
    defaultVisible: true,
  },
  { key: "visitCity", label: "Visiting Address City", defaultVisible: true },
  {
    key: "visitCountry",
    label: "Visiting Address Country",
    defaultVisible: true,
  },
  { key: "visitTelephone", label: "Telephone", defaultVisible: true },
  { key: "accountManager", label: "Account Manager", defaultVisible: true },
  { key: "representative", label: "Representative", defaultVisible: true },
  {
    key: "targetYearRevenue",
    label: "Target Year Revenue",
    defaultVisible: true,
  },
  { key: "revenueLastYear", label: "Revenue Last Year", defaultVisible: true },
  { key: "revenueThisYear", label: "Revenue This Year", defaultVisible: true },
  { key: "customerGroup", label: "Customer Group", defaultVisible: true },
  { key: "lastCallDate", label: "Last Call Date", defaultVisible: true },
  { key: "callUpcoming", label: "Call Upcoming", defaultVisible: true },
  { key: "lastVisitDate", label: "Last Visit Date", defaultVisible: true },
  { key: "visitUpcoming", label: "Visit Upcoming", defaultVisible: true },
  { key: "contactPerson", label: "Contact Person", defaultVisible: true },
  { key: "contactEmail", label: "Contact E-mail", defaultVisible: true },
  {
    key: "contactMobile",
    label: "Contact Mobile No.",
    defaultVisible: true,
  },
  { key: "customerRegionCode", label: "Region Code", defaultVisible: false },
  { key: "region", label: "Region", defaultVisible: true },
  { key: "callDue", label: "Call", defaultVisible: true },
  { key: "visitDue", label: "Visit", defaultVisible: true },
];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, col) => ({ ...acc, [col.key]: col.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

type Props = { rows: VisitScheduleRow[] };

export const VisitScheduleTable = ({ rows }: Props) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: VisitScheduleRow, key: ColumnKey) => {
    switch (key) {
      case "companyCode":
        return <TableCell key={key}>{row.companyCode}</TableCell>;
      case "companyName":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/companies/${row.companyUuid}`}
              className="underline-offset-4 hover:underline"
            >
              {row.companyName}
            </Link>
          </TableCell>
        );
      case "visitStreetAndNo":
        return <TableCell key={key}>{row.visitStreetAndNo ?? "—"}</TableCell>;
      case "visitPostalCode":
        return <TableCell key={key}>{row.visitPostalCode ?? "—"}</TableCell>;
      case "visitCity":
        return <TableCell key={key}>{row.visitCity ?? "—"}</TableCell>;
      case "visitCountry":
        return <TableCell key={key}>{row.visitCountry ?? "—"}</TableCell>;
      case "visitTelephone":
        return <TableCell key={key}>{row.visitTelephone ?? "—"}</TableCell>;
      case "accountManager":
        return <TableCell key={key}>{row.accountManager ?? "—"}</TableCell>;
      case "representative":
        return <TableCell key={key}>{row.representative ?? "—"}</TableCell>;
      case "targetYearRevenue":
        return (
          <TableCell key={key} className="text-right">
            {formatRevenue(row.targetYearRevenue)}
          </TableCell>
        );
      case "revenueLastYear":
        return (
          <TableCell key={key} className="text-right">
            {formatRevenue(row.revenueLastYear)}
          </TableCell>
        );
      case "revenueThisYear":
        return (
          <TableCell key={key} className="text-right">
            {formatRevenue(row.revenueThisYear)}
          </TableCell>
        );
      case "customerGroup":
        return <TableCell key={key}>{row.customerGroup ?? "—"}</TableCell>;
      case "lastCallDate":
        return <TableCell key={key}>{formatDateValue(row.lastCallDate)}</TableCell>;
      case "callUpcoming":
        return <TableCell key={key}>{formatDateValue(row.callUpcoming)}</TableCell>;
      case "lastVisitDate":
        return <TableCell key={key}>{formatDateValue(row.lastVisitDate)}</TableCell>;
      case "visitUpcoming":
        return <TableCell key={key}>{formatDateValue(row.visitUpcoming)}</TableCell>;
      case "contactPerson": {
        const parts = [row.contactFirstName, row.contactLastName].filter(
          Boolean,
        );
        return <TableCell key={key}>{parts.join(" ") || "—"}</TableCell>;
      }
      case "contactEmail":
        return <TableCell key={key}>{row.contactEmail ?? "—"}</TableCell>;
      case "contactMobile":
        return <TableCell key={key}>{row.contactMobile ?? "—"}</TableCell>;
      case "customerRegionCode":
        return <TableCell key={key}>{row.customerRegionCode ?? "—"}</TableCell>;
      case "region":
        return <TableCell key={key}>{row.region ?? "—"}</TableCell>;
      case "callDue":
        return (
          <TableCell key={key} className="text-center">
            {row.callDue ? "✓" : ""}
          </TableCell>
        );
      case "visitDue":
        return (
          <TableCell key={key} className="text-center">
            {row.visitDue ? "✓" : ""}
          </TableCell>
        );
      default:
        return <TableCell key={key}>—</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No customers or prospects found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.companyUuid}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
