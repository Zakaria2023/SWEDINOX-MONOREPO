"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteWorkPanelLock,
  WorkPanelLockRow,
} from "@/app/(dashboard)/open-work-panels/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { userName } from "@/lib/helpers";
import { WORK_PANEL_TYPE_LABELS } from "@/lib/labels";

type Props = {
  rows: WorkPanelLockRow[];
  userNames: Record<string, string>;
  /** Removing somebody's lock is an administrator's action. */
  canDelete: boolean;
};

type DeleteLockButtonProps = {
  lockUuid: string;
};

const RECORD_HREFS: Record<WorkPanelLockRow["panelType"], string> = {
  order: "/orders",
  company: "/companies",
};

const DeleteLockButton = ({ lockUuid }: DeleteLockButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () =>
    startTransition(async () => {
      const result = await deleteWorkPanelLock(lockUuid);
      setError(result.error ?? null);
      router.refresh();
    });

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={handleDelete}
      >
        {isPending ? "Removing..." : "Delete lock"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
};

export const OpenWorkPanelsTable = ({ rows, userNames, canDelete }: Props) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Work panel</TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Opened</TableHead>
        <TableHead>User</TableHead>
        <TableHead className="text-right">Action</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={5}
            className="h-24 text-center text-muted-foreground"
          >
            Nobody has a record open for editing.
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell>{WORK_PANEL_TYPE_LABELS[row.panelType]}</TableCell>
            <TableCell>
              <Link
                href={`${RECORD_HREFS[row.panelType]}/${row.recordUuid}`}
                className="text-primary hover:underline"
              >
                {row.description ?? row.recordUuid}
              </Link>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {row.openedAt.toLocaleString("en-GB")}
            </TableCell>
            <TableCell>{userName(row.userId, userNames)}</TableCell>
            <TableCell className="text-right">
              {canDelete ? <DeleteLockButton lockUuid={row.uuid} /> : "—"}
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);
