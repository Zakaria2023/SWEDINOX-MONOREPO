"use client";

import { FreightFlowRow } from "@/app/(dashboard)/freight-flow/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatNumber } from "@/lib/helpers";

type Props = {
  rows: FreightFlowRow[];
};

const COLUMN_COUNT = 17;

export const FreightFlowTable = ({ rows }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Year</TableHead>
          <TableHead className="text-right">Month</TableHead>
          <TableHead className="text-right">Revenue group code</TableHead>
          <TableHead>Revenue group</TableHead>
          <TableHead className="text-right">Starting stock</TableHead>
          <TableHead className="text-right">Received from producers</TableHead>
          <TableHead className="text-right">
            Received from producers abroad
          </TableHead>
          <TableHead className="text-right">
            Received from SFN members
          </TableHead>
          <TableHead className="text-right">
            Received from non-members
          </TableHead>
          <TableHead className="text-right">Supplied SFN</TableHead>
          <TableHead className="text-right">Supplied non-SFN</TableHead>
          <TableHead className="text-right">Delivered abroad</TableHead>
          <TableHead className="text-right">Ending inventory</TableHead>
          <TableHead className="text-right">Stock difference</TableHead>
          <TableHead className="text-right">To order manufacturers</TableHead>
          <TableHead className="text-right">On order non-producers</TableHead>
          <TableHead className="text-right">On order abroad</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={COLUMN_COUNT}
              className="h-24 text-center text-muted-foreground"
            >
              No goods flow found for this period.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={`${row.year}-${row.month}-${row.revenueGroupUuid}`}>
              <TableCell className="text-right">{row.year}</TableCell>
              <TableCell className="text-right">{row.month}</TableCell>
              <TableCell className="text-right">
                {row.revenueGroupNumber ?? "—"}
              </TableCell>
              <TableCell className="font-medium">
                {row.revenueGroupName ?? "Unclassified"}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.startingStock)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.receivedFromProducers)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.receivedFromProducersAbroad)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.receivedFromSfnMembers)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.receivedFromNonMembers)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.suppliedSfn)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.suppliedNonSfn)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.deliveredAbroad)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatNumber(row.endingInventory)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.stockDifference)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.toOrderManufacturers)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.onOrderNonProducers)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.onOrderAbroad)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
