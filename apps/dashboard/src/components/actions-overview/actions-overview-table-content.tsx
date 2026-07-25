"use client";

import { ActionRow } from "@/app/(dashboard)/actions-overview/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateValue } from "@/lib/helpers";

type Props = {
  rows: ActionRow[];
};

export const ActionsOverviewTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Number</TableHead>
          <TableHead>Action type</TableHead>
          <TableHead>Assigned to</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Created by</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Executed?</TableHead>
          <TableHead>Executed by</TableHead>
          <TableHead>Executed on</TableHead>
          <TableHead>Explanation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={11}
              className="h-24 text-center text-muted-foreground"
            >
              No actions found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="text-right font-medium">
                {row.number ?? "—"}
              </TableCell>
              <TableCell>{row.actionType ?? "—"}</TableCell>
              <TableCell>{row.assignedTo ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.created)}
              </TableCell>
              <TableCell>{row.createdBy ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.deadline)}
              </TableCell>
              <TableCell>{row.description ?? "—"}</TableCell>
              <TableCell>
                {row.executed === null ? "—" : row.executed ? "Yes" : "No"}
              </TableCell>
              <TableCell>{row.executedBy ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.executedOn)}
              </TableCell>
              <TableCell>{row.explanation ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
