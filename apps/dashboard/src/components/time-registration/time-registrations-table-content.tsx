"use client";

import Link from "next/link";
import { TimeRegistrationListItem } from "@/app/(dashboard)/time-registration/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  registrations: TimeRegistrationListItem[];
};

export const TimeRegistrationsTable = ({ registrations }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="time-registration-table"
          fileName="time-registration"
          sheetName="Time Registration"
        />
      </div>
      <Table id="time-registration-table">
        <TableHeader>
          <TableRow>
            <TableHead>Date Time</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Extra User</TableHead>
            <TableHead>Scan code</TableHead>
            <TableHead>Context</TableHead>
            <TableHead>Context reference</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Action reference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-24 text-center text-muted-foreground"
              >
                No time registrations found.
              </TableCell>
            </TableRow>
          ) : (
            registrations.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell className="font-medium whitespace-nowrap">
                  <Link
                    href={`/time-registration/${row.uuid}`}
                    className="text-primary hover:underline"
                  >
                    {new Date(row.dateTime).toLocaleString("en-GB")}
                  </Link>
                </TableCell>
                <TableCell>{row.user ?? "—"}</TableCell>
                <TableCell>{row.extraUser ?? "—"}</TableCell>
                <TableCell>{row.scanCode ?? "—"}</TableCell>
                <TableCell>{row.context ?? "—"}</TableCell>
                <TableCell>{row.contextReference ?? "—"}</TableCell>
                <TableCell>{row.action ?? "—"}</TableCell>
                <TableCell>{row.actionReference ?? "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
