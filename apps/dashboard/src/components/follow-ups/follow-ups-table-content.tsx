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
import { COMMON_TEXT } from "@/lib/labels";
import Link from "next/link";

type Props = {
  followUps: FollowUpListItem[];
};

// Number of whole days since the record was created.
const daysInSystem = (createdAt: Date | string) =>
  Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000),
  );

export const FollowUpsTable = ({ followUps }: Props) => {
  const na = COMMON_TEXT.notAvailable;

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
                  na
                )}
              </TableCell>
              <TableCell>{followUp.date ?? na}</TableCell>
              <TableCell>{followUp.by ?? na}</TableCell>
              <TableCell>{followUp.contactPerson ?? na}</TableCell>
              <TableCell className="max-w-xs truncate">
                {followUp.text ?? na}
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
