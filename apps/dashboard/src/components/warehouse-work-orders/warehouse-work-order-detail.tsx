import Link from "next/link";
import { WorkOrderDetail } from "@/app/(dashboard)/warehouse-work-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  orDash,
  pluralize,
  yesNo,
} from "@/lib/helpers";
import {
  WAREHOUSE_WORK_ORDER_LINE_TYPE_LABELS,
  WAREHOUSE_WORK_ORDER_STATUS_LABELS,
} from "@/lib/labels";

type Props = {
  workOrder: WorkOrderDetail;
};

export const WarehouseWorkOrderDetailView = ({ workOrder }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Work order</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Number" value={`#${workOrder.id}`} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Warehouse
          </p>
          {workOrder.warehouseName ? (
            <Link
              href={`/warehouses/${workOrder.warehouseUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {workOrder.warehouseName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Status"
          value={
            workOrder.status
              ? WAREHOUSE_WORK_ORDER_STATUS_LABELS[workOrder.status]
              : null
          }
        />
        <DetailField
          label="Lines"
          value={`${workOrder.lines.length} ${pluralize(
            workOrder.lines.length,
            "line",
          )}`}
        />
        <DetailField
          label="Created"
          value={formatDateValue(workOrder.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(workOrder.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">Lines</h2>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead className="text-right">Qty planned</TableHead>
              <TableHead className="text-right">Qty actual</TableHead>
              <TableHead className="text-right">Kg planned</TableHead>
              <TableHead className="text-right">Kg actual</TableHead>
              <TableHead>Charge</TableHead>
              <TableHead className="text-right">Priority</TableHead>
              <TableHead>Rush</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workOrder.lines.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={15}
                  className="h-24 text-center text-muted-foreground"
                >
                  No lines on this work order.
                </TableCell>
              </TableRow>
            ) : (
              workOrder.lines.map((line) => (
                <TableRow key={line.uuid}>
                  <TableCell>{formatDateColumn(line.date)}</TableCell>
                  <TableCell>
                    {line.type
                      ? WAREHOUSE_WORK_ORDER_LINE_TYPE_LABELS[line.type]
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      value={line.status}
                      label={
                        line.status
                          ? WAREHOUSE_WORK_ORDER_STATUS_LABELS[line.status]
                          : null
                      }
                    />
                  </TableCell>
                  <TableCell>{orDash(line.orderNumber)}</TableCell>
                  <TableCell>
                    {line.companyUuid && line.companyName ? (
                      <Link
                        href={`/companies/${line.companyUuid}`}
                        className="text-primary hover:underline"
                      >
                        {line.companyName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {orDash(line.productCode)}
                  </TableCell>
                  <TableCell>{orDash(line.fromLocation)}</TableCell>
                  <TableCell>{orDash(line.toLocation)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(line.qtyPlanned)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(line.qtyActual)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(line.kgPlanned)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(line.kgActual)}
                  </TableCell>
                  <TableCell>{orDash(line.internalCharge)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(line.priority)}
                  </TableCell>
                  <TableCell>{yesNo(line.rush)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  </div>
);
