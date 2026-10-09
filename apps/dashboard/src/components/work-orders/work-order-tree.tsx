"use client";

import { Fragment, ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { WorkOrderStatus } from "@/lib/enums";
import { cn, formatDateColumn, moneyString } from "@/lib/helpers";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/labels";

/**
 * One line, with everything the levels above it are grouped by.
 *
 * The reference system reads its work four levels deep — the day, what the job
 * is (a warehouse type, a machine option), the order number, then the lines —
 * so a line has to carry its own ancestry rather than being nested, which is
 * what lets one flat query feed the whole tree.
 */
export type WorkOrderTreeRow = {
  lineUuid: string;
  workOrderUuid: string;
  workOrderNumber: number;
  plannedDate: string | null;
  /** Level 2: the warehouse type, or the machine option and its machine. */
  groupLabel: string;
  status: WorkOrderStatus;
  /** How the line names itself — "1 Cold-rolled plate 304 1,5mm". */
  lineLabel: string;
};

export type TreeColumn<T> = {
  key: string;
  header: string;
  align?: "right";
  cell: (row: T) => ReactNode;
  /**
   * What this column contributes to the totals on the rows above. A column
   * without one stays blank there — a status or a location does not add up.
   */
  sum?: (row: T) => number;
};

type Props<T extends WorkOrderTreeRow> = {
  rows: T[];
  columns: TreeColumn<T>[];
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
  /** Where the work-order number links to. */
  workOrderHref: (row: T) => string;
  emptyMessage: string;
  /**
   * The tree column's header. The warehouse panel reads `Dag / Type /
   * Opdracht / Regel`, the production panel `Dag / Optie (Machine) /
   * Opdracht / Regel` (327402 and 327247, 8/9-10-2026).
   */
  levelsHeader?: string;
};

type Node<T> = {
  key: string;
  label: string;
  /** Present only on a work-order node, which is what the number links to. */
  row?: T;
  rows: T[];
  children: Node<T>[];
};

const groupBy = <T,>(rows: T[], key: (row: T) => string): Map<string, T[]> => {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const value = key(row);
    const bucket = out.get(value);
    if (bucket) {
      bucket.push(row);
    } else {
      out.set(value, [row]);
    }
  }
  return out;
};

const formatTotal = (value: number) =>
  Number.isInteger(value) ? String(value) : moneyString(value);

export const WorkOrderTree = <T extends WorkOrderTreeRow>({
  rows,
  columns,
  selected,
  onSelectedChange,
  workOrderHref,
  emptyMessage,
  levelsHeader = "Day / Option (Machine) / Order / Line",
}: Props<T>) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Days and jobs come out in the order the query returned them, so the tree
  // reads the way the list did rather than re-sorting itself.
  const tree = useMemo<Node<T>[]>(
    () =>
      [...groupBy(rows, (row) => row.plannedDate ?? "").entries()].map(
        ([date, dateRows]) => ({
          key: `d:${date}`,
          label: date ? formatDateColumn(date) : "No date",
          rows: dateRows,
          children: [
            ...groupBy(dateRows, (row) => row.groupLabel).entries(),
          ].map(([group, groupRows]) => ({
            key: `d:${date}|g:${group}`,
            label: group,
            rows: groupRows,
            children: [
              ...groupBy(groupRows, (row) => String(row.workOrderNumber)),
            ].map(([number, orderRows]) => ({
              key: `d:${date}|g:${group}|o:${number}`,
              label: number,
              row: orderRows[0],
              rows: orderRows,
              children: [],
            })),
          })),
        }),
      ),
    [rows],
  );

  // The reference's `1 2 3 4` buttons: open the tree down to that level and
  // fold everything below it — 1 shows the days, 4 shows every line.
  const showToLevel = (level: number) => {
    const fold = new Set<string>();
    for (const dateNode of tree) {
      if (level <= 1) {
        fold.add(dateNode.key);
      }
      for (const groupNode of dateNode.children) {
        if (level <= 2) {
          fold.add(groupNode.key);
        }
        for (const orderNode of groupNode.children) {
          if (level <= 3) {
            fold.add(orderNode.key);
          }
        }
      }
    }
    setCollapsed(fold);
  };

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

  // Ticking a day ticks everything under it, which is how the floor selects a
  // whole run without opening it.
  const setBranch = (branch: T[], checked: boolean) => {
    const next = new Set(selected);
    for (const row of branch) {
      if (checked) {
        next.add(row.lineUuid);
      } else {
        next.delete(row.lineUuid);
      }
    }
    onSelectedChange(next);
  };

  const branchState = (branch: T[]) => {
    const picked = branch.filter((row) => selected.has(row.lineUuid)).length;
    return {
      checked: picked > 0 && picked === branch.length,
      indeterminate: picked > 0 && picked < branch.length,
    };
  };

  const totalsFor = (branch: T[]) =>
    columns.map((column) =>
      column.sum
        ? formatTotal(
            branch.reduce((total, row) => total + (column.sum?.(row) ?? 0), 0),
          )
        : null,
    );

  const groupRow = (
    node: Node<T>,
    depth: number,
    content: ReactNode,
  ): ReactNode => {
    const { checked, indeterminate } = branchState(node.rows);
    const isOpen = !collapsed.has(node.key);
    const totals = totalsFor(node.rows);
    return (
      <TableRow key={node.key} className="bg-muted/40">
        <TableCell className="w-8">
          <Checkbox
            checked={checked}
            // A part-selected branch is neither on nor off, and the dash is the
            // only thing that says so. It is a DOM property, not an attribute.
            ref={(input) => {
              if (input) {
                input.indeterminate = indeterminate;
              }
            }}
            onChange={(event) => setBranch(node.rows, event.target.checked)}
            aria-label={`Select ${node.label}`}
          />
        </TableCell>
        <TableCell style={{ paddingInlineStart: `${depth * 1.25 + 0.5}rem` }}>
          <button
            type="button"
            onClick={() => toggle(node.key)}
            aria-expanded={isOpen}
            className="inline-flex items-center gap-1.5 text-left font-medium"
          >
            {isOpen ? (
              <ChevronDown className="size-4 shrink-0" />
            ) : (
              <ChevronRight className="size-4 shrink-0" />
            )}
            {content}
          </button>
        </TableCell>
        <TableCell>
          <StatusBadge
            value={node.rows[0].status}
            label={WORK_ORDER_STATUS_LABELS[node.rows[0].status]}
          />
        </TableCell>
        {totals.map((total, index) => (
          <TableCell
            key={columns[index].key}
            className={cn(
              "tabular-nums",
              columns[index].align === "right" && "text-right",
            )}
          >
            {total}
          </TableCell>
        ))}
      </TableRow>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => showToLevel(level)}
            aria-label={`Show the tree to level ${level}`}
            className="text-muted-foreground hover:bg-muted hover:text-foreground size-7 rounded-md border text-sm font-medium"
          >
            {level}
          </button>
        ))}
      </div>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>{levelsHeader}</TableHead>
            <TableHead>Status</TableHead>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(column.align === "right" && "text-right")}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + 3}
                className="text-muted-foreground h-24 text-center"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            tree.map((dateNode) => (
              <Fragment key={dateNode.key}>
                {groupRow(dateNode, 0, dateNode.label)}
                {!collapsed.has(dateNode.key) &&
                  dateNode.children.map((groupNode) => (
                    <Fragment key={groupNode.key}>
                      {groupRow(groupNode, 1, groupNode.label)}
                      {!collapsed.has(groupNode.key) &&
                        groupNode.children.map((orderNode) => (
                          <Fragment key={orderNode.key}>
                            {groupRow(
                              orderNode,
                              2,
                              orderNode.row ? (
                                <Link
                                  href={workOrderHref(orderNode.row)}
                                  className="text-primary hover:underline"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {orderNode.label}
                                </Link>
                              ) : (
                                orderNode.label
                              ),
                            )}
                            {!collapsed.has(orderNode.key) &&
                              orderNode.rows.map((row) => (
                                <TableRow key={row.lineUuid}>
                                  <TableCell className="w-8">
                                    <Checkbox
                                      checked={selected.has(row.lineUuid)}
                                      onChange={(event) =>
                                        setBranch([row], event.target.checked)
                                      }
                                      aria-label={`Select ${row.lineLabel}`}
                                    />
                                  </TableCell>
                                  <TableCell
                                    style={{ paddingInlineStart: "4.25rem" }}
                                  >
                                    {row.lineLabel}
                                  </TableCell>
                                  <TableCell>
                                    <StatusBadge
                                      value={row.status}
                                      label={
                                        WORK_ORDER_STATUS_LABELS[row.status]
                                      }
                                    />
                                  </TableCell>
                                  {columns.map((column) => (
                                    <TableCell
                                      key={column.key}
                                      className={cn(
                                        column.align === "right" &&
                                          "text-right tabular-nums",
                                      )}
                                    >
                                      {column.cell(row)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                          </Fragment>
                        ))}
                    </Fragment>
                  ))}
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    </div>
  );
};
