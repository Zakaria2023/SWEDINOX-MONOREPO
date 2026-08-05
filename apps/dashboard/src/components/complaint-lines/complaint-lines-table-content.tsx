"use client";

import Link from "next/link";
import { ComplaintLineRow } from "@/app/(dashboard)/complaint-lines/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateValue } from "@/lib/helpers";
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_CAUSE_LABELS,
  COMPLAINT_SOLUTION_LABELS,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
  CUSTOMER_GROUP_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";

type Props = {
  rows: ComplaintLineRow[];
};

const COLUMN_COUNT = 28;

export const ComplaintLinesTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Year</TableHead>
          <TableHead className="text-right">Month</TableHead>
          <TableHead>Report date</TableHead>
          <TableHead className="text-right">Complaint number</TableHead>
          <TableHead className="text-right">Company code</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Customer group</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Status date</TableHead>
          <TableHead>Complaint description</TableHead>
          <TableHead>Cause</TableHead>
          <TableHead>Explanation cause</TableHead>
          <TableHead>Solution</TableHead>
          <TableHead>Explanation solution</TableHead>
          <TableHead>Complaint type</TableHead>
          <TableHead>Correspondence name</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead className="text-right">Order</TableHead>
          <TableHead className="text-right">Order line</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Product description</TableHead>
          <TableHead>Responsible</TableHead>
          <TableHead>Created by</TableHead>
          <TableHead>Purchaser / seller</TableHead>
          <TableHead>Representative</TableHead>
          <TableHead>Warehouse section</TableHead>
          <TableHead>Creation date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={COLUMN_COUNT}
              className="h-24 text-center text-muted-foreground"
            >
              No complaint lines found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="text-right font-medium">
                <Link
                  href={`/complaint-lines/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.reportYear ?? `#${row.id}`}
                </Link>
              </TableCell>
              <TableCell className="text-right">
                {row.reportMonth ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.reportDate)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {row.complaintNumber ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.companyCode ?? "—"}
              </TableCell>
              <TableCell className="font-medium">
                {row.companyName ?? "—"}
              </TableCell>
              <TableCell>
                {row.customerGroup
                  ? CUSTOMER_GROUP_LABELS[row.customerGroup]
                  : "—"}
              </TableCell>
              <TableCell>
                {row.category ? COMPLAINT_CATEGORY_LABELS[row.category] : "—"}
              </TableCell>
              <TableCell>
                {row.status ? COMPLAINT_STATUS_LABELS[row.status] : "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.statusDate)}
              </TableCell>
              <TableCell className="max-w-64">
                <span className="line-clamp-2">{row.description ?? "—"}</span>
              </TableCell>
              <TableCell>
                {row.cause ? COMPLAINT_CAUSE_LABELS[row.cause] : "—"}
              </TableCell>
              <TableCell className="max-w-64">
                <span className="line-clamp-2">
                  {row.explanationOfCause ?? "—"}
                </span>
              </TableCell>
              <TableCell>
                {row.solution ? COMPLAINT_SOLUTION_LABELS[row.solution] : "—"}
              </TableCell>
              <TableCell className="max-w-64">
                <span className="line-clamp-2">
                  {row.explanationOfSolution ?? "—"}
                </span>
              </TableCell>
              <TableCell>
                {row.complaintType
                  ? COMPLAINT_TYPE_LABELS[row.complaintType]
                  : "—"}
              </TableCell>
              <TableCell>{row.correspondenceName ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.deadline)}
              </TableCell>
              <TableCell className="text-right">{row.orderId ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.orderLineNumber ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell>{row.responsibleName ?? "—"}</TableCell>
              <TableCell>{row.createdByName ?? "—"}</TableCell>
              <TableCell>
                {row.purchaserSeller ?? row.orderSeller ?? "—"}
              </TableCell>
              <TableCell>
                {row.representative
                  ? SALES_REPRESENTATIVE_LABELS[row.representative]
                  : "—"}
              </TableCell>
              <TableCell>{row.warehouseSection ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.createdAt)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
