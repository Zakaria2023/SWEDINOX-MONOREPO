"use client";

import Link from "next/link";
import {
  ComplaintOverviewColumnKey,
  ComplaintOverviewRow,
} from "@/app/(dashboard)/complaints/columns";
import { TableCell } from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  customerGroupLabel,
  formatDateColumn,
  formatMoney,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_CAUSE_LABELS,
  COMPLAINT_SOLUTION_LABELS,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  row: ComplaintOverviewRow;
  column: ComplaintOverviewColumnKey;
};

type LongTextProps = {
  value: string | null;
};

// Descriptions and explanations run to paragraphs; three lines keep a row
// readable and the full text is one click away on the complaint.
const LongText = ({ value }: LongTextProps) => (
  <TableCell className="min-w-56 max-w-80 whitespace-normal">
    <span className="line-clamp-3">{value ?? "—"}</span>
  </TableCell>
);

/**
 * One cell of either complaint overview. Both print the complaint the same way,
 * so both render it here.
 */
export const ComplaintOverviewCell = ({ row, column }: Props) => {
  switch (column) {
    case "reportYear":
      return (
        <TableCell className="text-right">{row.reportYear ?? "—"}</TableCell>
      );
    case "reportMonth":
      return (
        <TableCell className="text-right">{row.reportMonth ?? "—"}</TableCell>
      );
    case "reportDate":
      return (
        <TableCell className="whitespace-nowrap">
          {formatDateColumn(row.reportDate)}
        </TableCell>
      );
    case "complaintNumber":
      return (
        <TableCell className="text-right font-medium">
          <Link
            href={`/complaints/${row.complaintUuid}`}
            className="text-primary hover:underline"
          >
            {row.complaintNumber}
          </Link>
        </TableCell>
      );
    case "companyCode":
      return (
        <TableCell className="text-right">{row.companyCode ?? "—"}</TableCell>
      );
    case "companyName":
      return (
        <TableCell>
          <Link
            href={`/companies/${row.companyUuid}`}
            className="hover:underline"
          >
            {row.companyName ?? "—"}
          </Link>
        </TableCell>
      );
    case "customerGroup":
      return <TableCell>{customerGroupLabel(row.customerGroup)}</TableCell>;
    case "accountManager":
      return (
        <TableCell>{salesRepresentativeLabel(row.accountManager)}</TableCell>
      );
    case "category":
      return (
        <TableCell>
          {row.category ? COMPLAINT_CATEGORY_LABELS[row.category] : "—"}
        </TableCell>
      );
    case "status":
      return (
        <TableCell>
          <StatusBadge
            value={row.status}
            label={row.status ? COMPLAINT_STATUS_LABELS[row.status] : null}
          />
        </TableCell>
      );
    case "resolutionDays":
      return <TableCell className="text-right">{row.resolutionDays}</TableCell>;
    case "description":
      return <LongText value={row.description} />;
    case "cause":
      return (
        <TableCell>
          {row.cause ? COMPLAINT_CAUSE_LABELS[row.cause] : "—"}
        </TableCell>
      );
    case "explanationOfCause":
      return <LongText value={row.explanationOfCause} />;
    case "solution":
      return (
        <TableCell>
          {row.solution ? COMPLAINT_SOLUTION_LABELS[row.solution] : "—"}
        </TableCell>
      );
    case "explanationOfSolution":
      return <LongText value={row.explanationOfSolution} />;
    case "complaintType":
      return (
        <TableCell>
          {row.complaintType ? COMPLAINT_TYPE_LABELS[row.complaintType] : "—"}
        </TableCell>
      );
    case "correspondenceName":
      return <TableCell>{row.correspondenceName ?? "—"}</TableCell>;
    case "deadline":
      return (
        <TableCell className="whitespace-nowrap">
          {formatDateColumn(row.deadline)}
        </TableCell>
      );
    case "document":
      return (
        <TableCell className="whitespace-nowrap">
          {row.documentHref && row.documentCode ? (
            <Link
              href={row.documentHref}
              className="text-primary hover:underline"
            >
              {row.documentCode}
            </Link>
          ) : (
            (row.documentCode ?? "—")
          )}
        </TableCell>
      );
    case "productCode":
      return (
        <TableCell className="whitespace-nowrap">
          {row.productCode ?? "—"}
        </TableCell>
      );
    case "productDescription":
      return <TableCell>{row.productDescription ?? "—"}</TableCell>;
    case "responsible":
      return <TableCell>{row.responsible ?? "—"}</TableCell>;
    case "statusDate":
      return (
        <TableCell className="whitespace-nowrap">
          {formatDateColumn(row.statusDate)}
        </TableCell>
      );
    case "capturedBy":
      return <TableCell>{row.capturedBy ?? "—"}</TableCell>;
    case "purchaserSeller":
      return <TableCell>{row.purchaserSeller ?? "—"}</TableCell>;
    case "representative":
      return (
        <TableCell>{salesRepresentativeLabel(row.representative)}</TableCell>
      );
    case "creationDate":
      return (
        <TableCell className="whitespace-nowrap">
          {formatDateColumn(row.creationDate)}
        </TableCell>
      );
    case "totalCosts":
      return (
        <TableCell className="text-right whitespace-nowrap">
          {formatMoney(row.totalCosts)}
        </TableCell>
      );
  }
};
