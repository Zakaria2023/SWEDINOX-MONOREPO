"use client";

import { FollowUpListItem } from "@/app/(dashboard)/follow-ups/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { daysInSystem } from "@/lib/helpers";
import Link from "next/link";

type Props = {
  followUps: FollowUpListItem[];
};

export const FollowUpsTable = ({ followUps }: Props) => {

  if (followUps.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No follow-ups yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>By</TableHead>
            <TableHead>Contact person</TableHead>
            <TableHead>Text</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead className="text-right">Days in system</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {followUps.map((followUp) => (
            <TableRow key={followUp.uuid}>
              <TableCell>
                {followUp.companyName ? (
                  <Link
                    href={`/companies/${followUp.companyUuid}`}
                    className="text-primary hover:underline"
                  >
                    {followUp.companyName}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/follow-ups/${followUp.uuid}`}
                  className="text-primary hover:underline"
                >
                  {followUp.date ?? `Follow-up #${followUp.id}`}
                </Link>
              </TableCell>
              <TableCell>{followUp.by ?? "—"}</TableCell>
              <TableCell>{followUp.contactPerson ?? "—"}</TableCell>
              <TableCell className="max-w-xs truncate">
                {followUp.text ?? "—"}
              </TableCell>
              <TableCell>{followUp.completed ? "Yes" : "No"}</TableCell>
              <TableCell className="text-right">
                {daysInSystem(followUp.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
