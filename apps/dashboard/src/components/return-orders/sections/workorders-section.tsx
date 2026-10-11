import Link from "next/link";
import { ReturnOrderDetail } from "@/app/(dashboard)/return-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateColumn, formatNumber, orDash } from "@/lib/helpers";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/labels";

type Props = {
  returnOrder: ReturnOrderDetail;
};

/**
 * The `Workorders` panel of a saved return: the unloading that takes the goods
 * back in, and the production that touched them — reached through the order
 * line the return points at, the only link a workorder carries back.
 */
export const WorkordersSection = ({ returnOrder }: Props) => (
  <CollapsibleSection
    title="Workorders"
    summary={[
      returnOrder.warehouseWorkOrderUuid
        ? "1 warehouse workorder"
        : "0 warehouse workorders",
      `${returnOrder.workOrders.length} production workorder line(s)`,
    ].join(" · ")}
  >
    <div className="space-y-4 p-3">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Warehouse workorders</h3>
        {returnOrder.warehouseWorkOrderUuid ? (
          <Link
            href={`/warehouse-work-orders/${returnOrder.warehouseWorkOrderUuid}`}
            className="text-sm text-primary hover:underline"
          >
            Open the unloading workorder
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">
            No unloading has been raised for this return.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Production workorders</h3>
        {returnOrder.workOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No production workorder touched the goods on this return.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workorder</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty planned</TableHead>
                  <TableHead className="text-right">Qty actual</TableHead>
                  <TableHead className="text-right">Kg actual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnOrder.workOrders.map((line) => (
                  <TableRow key={line.uuid}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/production-workorders/${line.workOrderUuid}`}
                        className="text-primary hover:underline"
                      >
                        {orDash(line.workOrderNumber)}
                      </Link>
                    </TableCell>
                    <TableCell>{orDash(line.machineName)}</TableCell>
                    <TableCell>{formatDateColumn(line.plannedDate)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        value={line.status}
                        label={
                          line.status
                            ? WORK_ORDER_STATUS_LABELS[line.status]
                            : null
                        }
                      />
                    </TableCell>
                    <TableCell>{orDash(line.productCode)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(line.qtyPlanned ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(line.qtyActual ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(line.kgActual ?? 0))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Transport workorders</h3>
        <p className="text-sm text-muted-foreground">
          Not linked to returns yet.
        </p>
      </section>
    </div>
  </CollapsibleSection>
);
