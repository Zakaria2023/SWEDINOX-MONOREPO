"use client";

import { Fragment } from "react";
import { SawingLayoutListItem } from "@/app/(dashboard)/sawing-layouts/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  SAWING_LAYOUT_FETCH_STATUS_LABELS,
  SAWING_STATUS_LABELS,
} from "@/lib/labels";
import { formatDateValue } from "@/lib/helpers";
import type { SawingLayoutFetchStatus, SawingStatus } from "@/lib/enums";

type Props = {
  layouts: SawingLayoutListItem[];
};

const STATUS_STYLES: Record<SawingLayoutFetchStatus | SawingStatus, string> = {
  new: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const PIECE_SLOTS = [
  { qty: "qty1", length: "length1" },
  { qty: "qty2", length: "length2" },
  { qty: "qty3", length: "length3" },
  { qty: "qty4", length: "length4" },
  { qty: "qty5", length: "length5" },
  { qty: "qty6", length: "length6" },
  { qty: "qty7", length: "length7" },
  { qty: "qty8", length: "length8" },
  { qty: "qty9", length: "length9" },
  { qty: "qty10", length: "length10" },
] as const;

const formatBool = (value: boolean | null): string => {
  if (value === null) {
    return "—";
  }
  return value ? "Yes" : "No";
};

export const SawingLayoutsTable = ({ layouts }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Machine</TableHead>
          <TableHead>Fetch date</TableHead>
          <TableHead>Fetch code</TableHead>
          <TableHead>Fetch status</TableHead>
          <TableHead className="text-right">Fetch qty</TableHead>
          <TableHead>Warehouse</TableHead>
          <TableHead>Section</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Length</TableHead>
          <TableHead className="text-right">Residual length</TableHead>
          <TableHead>Sawing date</TableHead>
          <TableHead>Sawing code</TableHead>
          <TableHead>Sawing status</TableHead>
          <TableHead>Sawing product</TableHead>
          <TableHead>Sawing product description</TableHead>
          <TableHead className="text-right">Total pieces to be sawn</TableHead>
          <TableHead>Sawing of TL</TableHead>
          <TableHead>Sawing according to layout</TableHead>
          <TableHead>Layout includes cut-off</TableHead>
          <TableHead>Follow-up processing</TableHead>
          <TableHead>To location(s)</TableHead>
          {PIECE_SLOTS.map((_, index) => (
            <Fragment key={`slot-head-${index}`}>
              <TableHead className="text-right whitespace-nowrap">
                Qty. {index + 1}
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Length {index + 1}
              </TableHead>
            </Fragment>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {layouts.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={23 + PIECE_SLOTS.length * 2}
              className="h-24 text-center text-muted-foreground"
            >
              No sawing layouts found.
            </TableCell>
          </TableRow>
        ) : (
          layouts.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="font-medium">
                {row.machine ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.fetchDate)}
              </TableCell>
              <TableCell>{row.fetchCode ?? "—"}</TableCell>
              <TableCell>
                {row.fetchStatus ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.fetchStatus]}`}
                  >
                    {SAWING_LAYOUT_FETCH_STATUS_LABELS[row.fetchStatus]}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-right">
                {row.fetchQty ?? "—"}
              </TableCell>
              <TableCell>{row.warehouse ?? "—"}</TableCell>
              <TableCell>{row.section ?? "—"}</TableCell>
              <TableCell>{row.location ?? "—"}</TableCell>
              <TableCell>{row.product ?? "—"}</TableCell>
              <TableCell>{row.description ?? "—"}</TableCell>
              <TableCell className="text-right">{row.length ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.residualLength ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.sawingDate)}
              </TableCell>
              <TableCell>{row.sawingCode ?? "—"}</TableCell>
              <TableCell>
                {row.sawingStatus ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.sawingStatus]}`}
                  >
                    {SAWING_STATUS_LABELS[row.sawingStatus]}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{row.sawingProduct ?? "—"}</TableCell>
              <TableCell>{row.sawingProductDescription ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.totalPiecesToBeSawn ?? "—"}
              </TableCell>
              <TableCell>{row.sawingOfTl ?? "—"}</TableCell>
              <TableCell>{formatBool(row.sawingAccordingToLayout)}</TableCell>
              <TableCell>{formatBool(row.layoutIncludesCutoff)}</TableCell>
              <TableCell>{row.followUpProcessing ?? "—"}</TableCell>
              <TableCell>{row.toLocations ?? "—"}</TableCell>
              {PIECE_SLOTS.map((slot, index) => (
                <Fragment key={`${row.uuid}-slot-${index}`}>
                  <TableCell className="text-right">
                    {row[slot.qty] ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {row[slot.length] ?? "—"}
                  </TableCell>
                </Fragment>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
