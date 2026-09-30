"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Package, Plus, Printer, Tag } from "lucide-react";
import {
  cancelWarehouseWorkOrder,
  getWarehouseWorkOrderLineDetail,
  releaseWarehouseWorkOrder,
  saveWarehouseWorkOrderPackaging,
  WorkOrderDetail,
  WorkOrderLineListItem,
} from "@/app/(dashboard)/warehouse-work-orders/actions";
import { AvailableStockOption } from "@/app/(dashboard)/warehouse-work-orders/actions";
import { LocationOption } from "@/app/(dashboard)/locations/actions";
import { ClerkUserOption } from "@/lib/server/clerk";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { DetailField } from "@/components/ui/detail-field";
import { FormError } from "@/components/ui/form-error";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatDateValue,
  orDash,
  pluralize,
  warehouseWorkOrderTypeMetaOf,
  yesNo,
} from "@/lib/helpers";
import {
  PACKAGING_TYPE_LABELS,
  WORK_ORDER_STATUS_LABELS,
  WAREHOUSE_WORK_ORDER_TYPE_LABELS,
} from "@/lib/labels";
import { CancelWorkOrderDialog } from "@/components/work-orders/cancel-work-order-dialog";
import { LineDetailDialog } from "@/components/work-orders/line-detail-dialog";
import { PackagingDialog } from "@/components/work-orders/packaging-dialog";
import { AddLineDialog } from "./add-line-dialog";
import { PrepareLineDialog } from "./prepare-line-dialog";
import { ReportCompletionDialog } from "./report-completion-dialog";

type Props = {
  workOrder: WorkOrderDetail;
  stockOptions: AvailableStockOption[];
  locations: LocationOption[];
  users: ClerkUserOption[];
};

// What the goods do when a line of this job is reported, said in the words the
// floor uses rather than the enum's.
const EFFECT_TEXT: Record<string, string> = {
  in: "Goods arrive from outside the company.",
  out: "Goods leave the company for good.",
  move: "A lot moves between two locations. The total on hand does not change.",
  count: "A lot is set to what was actually found on the shelf.",
};

export const WarehouseWorkOrderDetailView = ({
  workOrder,
  stockOptions,
  locations,
  users,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | undefined>();
  const [addingLine, setAddingLine] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [packaging, setPackaging] = useState(false);
  const [detailLine, setDetailLine] =
    useState<WorkOrderLineListItem | null>(null);
  const [preparingLine, setPreparingLine] =
    useState<WorkOrderLineListItem | null>(null);
  const [reportingLine, setReportingLine] =
    useState<WorkOrderLineListItem | null>(null);

  const isNew = workOrder.status === "new";
  const isReleased = workOrder.status === "released";
  const isApproved = workOrder.status === "approved";
  const meta = warehouseWorkOrderTypeMetaOf(workOrder.type);

  const release = (printStockLabels: boolean) => {
    setActionError(undefined);
    startTransition(async () => {
      const result = await releaseWarehouseWorkOrder(
        workOrder.uuid,
        printStockLabels,
      );
      if (result.success) {
        router.refresh();
        return;
      }
      setActionError(result.error);
    });
  };

  return (
    <div className="space-y-6">
      {/* Release freezes the basket and prints; cancelling undoes it. Nothing
          here touches stock — that happens only when a line is reported. */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setAddingLine(true)}
          disabled={!isNew || isPending}
        >
          <Plus className="size-4" />
          Add line
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => release(true)}
          disabled={!isNew || isPending}
        >
          <Printer className="size-4" />
          Release
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => release(false)}
          disabled={!isNew || isPending}
        >
          <Tag className="size-4" />
          Release without stock labels
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setPackaging(true)}
          disabled={isApproved || isPending}
        >
          <Package className="size-4" />
          Package
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setCancelling(true)}
          disabled={isApproved || isPending}
        >
          <Ban className="size-4" />
          Cancel
        </Button>
      </div>

      <FormError>{actionError}</FormError>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Work order</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Number" value={String(workOrder.number)} />
          <DetailField
            label="Type"
            value={WAREHOUSE_WORK_ORDER_TYPE_LABELS[workOrder.type]}
          />
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
            label="Planned"
            value={formatDateValue(workOrder.plannedDate)}
          />
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Status
            </p>
            <div className="mt-1">
              <StatusBadge
                value={workOrder.status}
                label={WORK_ORDER_STATUS_LABELS[workOrder.status]}
              />
            </div>
          </div>
          <DetailField
            label="Lines"
            value={`${workOrder.lineCount} ${pluralize(
              workOrder.lineCount,
              "line",
            )}`}
          />
          <DetailField
            label="Released"
            value={
              workOrder.releasedAt
                ? formatDateValue(workOrder.releasedAt)
                : "Not yet"
            }
          />
          <DetailField
            label="Stock labels"
            value={
              workOrder.releasedAt
                ? yesNo(workOrder.stockLabelsPrinted)
                : "Not yet"
            }
          />
        </div>
        {meta && (
          <p className="text-sm text-muted-foreground">
            {EFFECT_TEXT[meta.stockEffect]}
          </p>
        )}
      </section>

      {/* Planned against what the floor actually did, which is the only figure
          that says whether the job is finished. */}
      <section className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Progress</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DetailField
            label="Qty planned"
            value={String(workOrder.qtyPlanned)}
          />
          <DetailField label="Qty ready" value={String(workOrder.qtyActual)} />
          <DetailField label="Kg planned" value={String(workOrder.kgPlanned)} />
          <DetailField label="Kg ready" value={String(workOrder.kgActual)} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Lines</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
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
                <TableHead className="text-right">Labels</TableHead>
                <TableHead>Rush</TableHead>
                <TableHead />
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
                    <TableCell>{orDash(line.lineNumber)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        value={line.status}
                        label={
                          WORK_ORDER_STATUS_LABELS[line.status]
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
                    {/* An empty side is the company boundary, not a gap in the
                        record: the goods came from outside, or they left. */}
                    <TableCell>{line.fromLocationName ?? "—"}</TableCell>
                    <TableCell>{line.toLocationName ?? "—"}</TableCell>
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
                    <TableCell>{orDash(line.charge)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.customerLabels + line.stockLabels}
                    </TableCell>
                    <TableCell>{yesNo(line.rush)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setDetailLine(line)}
                        >
                          Details
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setPreparingLine(line)}
                          disabled={line.status === "approved" || isPending}
                        >
                          To prepare
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setReportingLine(line)}
                          disabled={
                            !isReleased ||
                            line.status === "approved" ||
                            isPending
                          }
                        >
                          Report completion
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Packaging</h2>
        {workOrder.packagings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No packaging recorded against this work order.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Packaging</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead>Specification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrder.packagings.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell>{PACKAGING_TYPE_LABELS[row.packaging]}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.quantity}
                  </TableCell>
                  <TableCell>{orDash(row.specification)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <AddLineDialog
        workOrderUuid={addingLine ? workOrder.uuid : null}
        stockOptions={stockOptions}
        locations={locations}
        onOpenChange={setAddingLine}
      />
      <LineDetailDialog
        line={detailLine}
        load={getWarehouseWorkOrderLineDetail}
        onOpenChange={(open) => {
          if (!open) {
            setDetailLine(null);
          }
        }}
      />

      <PrepareLineDialog
        line={preparingLine}
        onOpenChange={(open) => {
          if (!open) {
            setPreparingLine(null);
          }
        }}
      />
      <ReportCompletionDialog
        line={reportingLine}
        workOrderType={workOrder.type}
        locations={locations}
        users={users}
        onOpenChange={(open) => {
          if (!open) {
            setReportingLine(null);
          }
        }}
      />
      <PackagingDialog
        workOrderUuid={packaging ? workOrder.uuid : null}
        existing={workOrder.packagings}
        save={saveWarehouseWorkOrderPackaging}
        onOpenChange={setPackaging}
      />
      <CancelWorkOrderDialog
        workOrderUuid={cancelling ? workOrder.uuid : null}
        cancel={cancelWarehouseWorkOrder}
        returnTo="/warehouse-work-orders"
        onOpenChange={setCancelling}
      />
    </div>
  );
};
