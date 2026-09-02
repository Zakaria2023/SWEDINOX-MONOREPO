"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Package, Printer } from "lucide-react";
import {
  approveProductionWorkOrder,
  cancelProductionWorkOrder,
  getProductionWorkOrderLineDetail,
  ProductionWorkOrderDetail,
  ProductionWorkOrderLineItem,
  releaseProductionWorkOrder,
  saveProductionWorkOrderPackaging,
} from "@/app/(dashboard)/production-workorders/actions";
import { AvailableStockOption } from "@/app/(dashboard)/warehouse-work-orders/actions";
import { LocationOption } from "@/app/(dashboard)/locations/actions";
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
import { CancelWorkOrderDialog } from "@/components/work-orders/cancel-work-order-dialog";
import { LineDetailDialog } from "@/components/work-orders/line-detail-dialog";
import { PackagingDialog } from "@/components/work-orders/packaging-dialog";
import { formatDateValue, orDash, pluralize, yesNo } from "@/lib/helpers";
import {
  MACHINE_OPTION_LABELS,
  PACKAGING_TYPE_LABELS,
  REMAINDER_CATEGORY_LABELS,
  WORK_ORDER_STATUS_LABELS,
} from "@/lib/labels";
import { ReportCutDialog } from "./report-cut-dialog";
import { ReportTreatmentDialog } from "./report-treatment-dialog";

type Props = {
  workOrder: ProductionWorkOrderDetail;
  stockOptions: AvailableStockOption[];
  locations: LocationOption[];
};

export const ProductionWorkOrderDetailView = ({
  workOrder,
  stockOptions,
  locations,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | undefined>();
  const [cancelling, setCancelling] = useState(false);
  const [packaging, setPackaging] = useState(false);
  const [reportingCut, setReportingCut] = useState(false);
  const [detailLine, setDetailLine] =
    useState<ProductionWorkOrderLineItem | null>(null);
  const [reportingLine, setReportingLine] =
    useState<ProductionWorkOrderLineItem | null>(null);

  const isNew = workOrder.status === "new";
  const isReleased = workOrder.status === "released";
  const isReady = workOrder.status === "ready";
  const isApproved = workOrder.status === "approved";

  const run = (
    action: () => Promise<{ error?: string; success?: boolean }>,
  ) => {
    setActionError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        router.refresh();
        return;
      }
      setActionError(result.error);
    });
  };

  return (
    <div className="space-y-6">
      {/* Release freezes the run and prints its papers; reporting is what moves
          the stock; approving signs off what came off the machine. */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => run(() => releaseProductionWorkOrder(workOrder.uuid))}
          disabled={!isNew || isPending}
        >
          <Printer className="size-4" />
          Release
        </Button>
        {/* A cut is reported for the whole run at once, because once two coils
            are on the same bed there is no saying which line a piece came off.
            A treatment is reported line by line, from the grid below. */}
        {workOrder.cuts && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setReportingCut(true)}
            disabled={!isReleased || isPending}
          >
            Report completion
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => run(() => approveProductionWorkOrder(workOrder.uuid))}
          disabled={!isReady || isPending}
        >
          <CheckCircle2 className="size-4" />
          Approve
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
            label="Option"
            value={
              workOrder.option ? MACHINE_OPTION_LABELS[workOrder.option] : "—"
            }
          />
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Machine
            </p>
            {workOrder.machineName ? (
              <Link
                href={`/machines/${workOrder.machineUuid}`}
                className="text-primary text-sm hover:underline"
              >
                {workOrder.machineName}
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
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
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
            label="Reported as"
            value={
              workOrder.cuts ? "A cut — kilos must balance" : "A treatment"
            }
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Progress</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DetailField
            label="Qty planned"
            value={String(workOrder.qtyPlanned)}
          />
          <DetailField label="Qty made" value={String(workOrder.qtyActual)} />
          <DetailField label="Kg planned" value={String(workOrder.kgPlanned)} />
          <DetailField label="Kg made" value={String(workOrder.kgActual)} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Lines</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Extra options</TableHead>
                <TableHead>Back</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Qty planned</TableHead>
                <TableHead className="text-right">Qty actual</TableHead>
                <TableHead className="text-right">Kg planned</TableHead>
                <TableHead className="text-right">Kg actual</TableHead>
                <TableHead>Charge</TableHead>
                <TableHead>Rush</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrder.lines.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={17}
                    className="text-muted-foreground h-24 text-center"
                  >
                    No lines on this work order.
                  </TableCell>
                </TableRow>
              ) : (
                workOrder.lines.map((line) => (
                  <TableRow key={line.uuid}>
                    <TableCell>{orDash(line.lineNumber)}</TableCell>
                    <TableCell>{orDash(line.itemNumber)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        value={line.status}
                        label={WORK_ORDER_STATUS_LABELS[line.status]}
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
                    <TableCell>{orDash(line.extraOptions)}</TableCell>
                    {/* The rack the leftovers go back to, the machine the goods
                        are taken from, and where the finished work lands. */}
                    <TableCell>{line.backLocationName ?? "—"}</TableCell>
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
                        {!workOrder.cuts && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setReportingLine(line)}
                            disabled={
                              !isReleased ||
                              line.status === "ready" ||
                              line.status === "approved" ||
                              isPending
                            }
                          >
                            Report completion
                          </Button>
                        )}
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
        <h2 className="border-b pb-2 text-base font-semibold">Fetched</h2>
        {workOrder.picks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nothing recorded as taken to the machine yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead className="text-right">Qty planned</TableHead>
                  <TableHead className="text-right">Qty actual</TableHead>
                  <TableHead className="text-right">Kg actual</TableHead>
                  <TableHead>Executed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrder.picks.map((pick) => (
                  <TableRow key={pick.uuid}>
                    <TableCell>{pick.fromLocationName ?? "—"}</TableCell>
                    <TableCell>
                      {orDash(pick.charge ?? pick.stockCharge)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(pick.qtyPlanned)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(pick.qtyActual)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(pick.kgActual)}
                    </TableCell>
                    <TableCell>
                      {pick.executedAt ? formatDateValue(pick.executedAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Remainders</h2>
        {workOrder.remainders.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nothing left over on this run.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Kg</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrder.remainders.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell>
                    {REMAINDER_CATEGORY_LABELS[row.category]}
                  </TableCell>
                  <TableCell>
                    {orDash(row.productCode ?? row.productName)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.quantity}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.kg}
                  </TableCell>
                  <TableCell>{row.toLocationName ?? "—"}</TableCell>
                  <TableCell>{orDash(row.remark)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Packaging</h2>
        {workOrder.packagings.length === 0 ? (
          <p className="text-muted-foreground text-sm">
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

      <LineDetailDialog
        line={detailLine}
        load={getProductionWorkOrderLineDetail}
        onOpenChange={(open) => {
          if (!open) {
            setDetailLine(null);
          }
        }}
      />
      <ReportTreatmentDialog
        line={reportingLine}
        onOpenChange={(open) => {
          if (!open) {
            setReportingLine(null);
          }
        }}
      />
      <ReportCutDialog
        workOrder={reportingCut ? workOrder : null}
        stockOptions={stockOptions}
        locations={locations}
        onOpenChange={setReportingCut}
      />
      <PackagingDialog
        workOrderUuid={packaging ? workOrder.uuid : null}
        existing={workOrder.packagings}
        save={saveProductionWorkOrderPackaging}
        onOpenChange={setPackaging}
      />
      <CancelWorkOrderDialog
        workOrderUuid={cancelling ? workOrder.uuid : null}
        cancel={cancelProductionWorkOrder}
        returnTo="/production-workorders"
        onOpenChange={setCancelling}
      />
    </div>
  );
};
