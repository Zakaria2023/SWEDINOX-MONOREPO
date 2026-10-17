"use client";

import { useState } from "react";
import Link from "next/link";
import { Box, Eye, Plus, Trash2 } from "lucide-react";
import {
  OrderProductionWorkOrderRow,
  OrderTransportWorkOrderRow,
  OrderWarehouseWorkOrderRow,
  OrderWorkOrders,
} from "@/app/(dashboard)/orders/[uuid]/actions";
import { Button } from "@/components/shadcn/button";
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
import {
  cn,
  formatDateColumn,
  formatNumber,
  orDash,
  pluralize,
} from "@/lib/helpers";
import {
  MACHINE_OPTION_LABELS,
  STOCK_UNIT_LABELS,
  TRANSPORT_DIRECTION_LABELS,
  TRIP_STATUS_LABELS,
  WAREHOUSE_WORK_ORDER_TYPE_LABELS,
  WORK_ORDER_STATUS_LABELS,
} from "@/lib/labels";

const EMPTY_WAREHOUSE =
  "No warehouse work orders — nothing has been picked yet.";
const EMPTY_PRODUCTION =
  "No production work orders — nothing on this order is cut.";
const EMPTY_TRANSPORT =
  "No transport work orders — nothing is planned onto a lorry.";
const NOT_BUILT_TITLE =
  "Not built: work orders are raised by making the order final";

type Props = {
  workOrders: OrderWorkOrders;
};

type WarehouseTableProps = {
  rows: OrderWarehouseWorkOrderRow[];
};

type ProductionTableProps = {
  rows: OrderProductionWorkOrderRow[];
};

type TransportTableProps = {
  rows: OrderTransportWorkOrderRow[];
};

type WorkOrderToolbarProps = {
  /** The selected row's product, which `Show product` opens. */
  productUuid: string | null;
  /** `View` after `Show product`, as the transport panel has it. */
  withView?: boolean;
};

/**
 * `New · Delete · Show product` above each work-order grid. New and Delete
 * are greyed on the reference's order as well (100629, 8-10-2026); Show product
 * opens the article of the selected row.
 */
const WorkOrderToolbar = ({
  productUuid,
  withView = false,
}: WorkOrderToolbarProps) => (
  <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 px-2 py-1">
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled
      title={NOT_BUILT_TITLE}
    >
      <Plus className="size-4" />
      New
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled
      title={NOT_BUILT_TITLE}
    >
      <Trash2 className="size-4" />
      Delete
    </Button>
    {productUuid ? (
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href={`/products/${productUuid}`} />}
      >
        <Box className="size-4" />
        Show product
      </Button>
    ) : (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled
        title="Select a row first"
      >
        <Box className="size-4" />
        Show product
      </Button>
    )}
    {withView && (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled
        title="Not built: the transport line's own window"
      >
        <Eye className="size-4" />
        View
      </Button>
    )}
  </div>
);

/** The reference's columns, in its order (441/442, order 100629). */
const WarehouseWorkOrderTable = ({ rows }: WarehouseTableProps) => {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const selected = rows.find((row) => row.uuid === selectedUuid) ?? null;

  return (
    <div className="space-y-2">
      <WorkOrderToolbar productUuid={selected?.productUuid ?? null} />
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">Item</TableHead>
              <TableHead>Workorder</TableHead>
              <TableHead className="text-right">Line</TableHead>
              <TableHead>Workorder date</TableHead>
              <TableHead>Date finished</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Length</TableHead>
              <TableHead className="text-right">Width</TableHead>
              <TableHead className="text-right">Thickness</TableHead>
              <TableHead className="text-right">Qty(p)</TableHead>
              <TableHead className="text-right">Qty(a)</TableHead>
              <TableHead>U(p)</TableHead>
              <TableHead className="text-right">Kg(p)</TableHead>
              <TableHead className="text-right">Kg(a)</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Charge</TableHead>
              <TableHead>Internal charge</TableHead>
              <TableHead>Purchase</TableHead>
              <TableHead>Stock category</TableHead>
              <TableHead>Quality code</TableHead>
              <TableHead className="text-right">Colli</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={24}
                  className="h-16 text-center text-muted-foreground"
                >
                  {EMPTY_WAREHOUSE}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.uuid}
                  onClick={() => setSelectedUuid(row.uuid)}
                  className={cn(
                    "cursor-pointer whitespace-nowrap",
                    row.uuid === selectedUuid && "bg-accent",
                  )}
                >
                  <TableCell className="text-right font-medium tabular-nums">
                    {orDash(
                      row.orderLineNumber === null
                        ? null
                        : row.orderLineNumber * 10,
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/warehouse-work-orders/${row.workOrderUuid}`}
                      className="text-primary hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {row.workOrderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.lineNumber)}
                  </TableCell>
                  <TableCell>{formatDateColumn(row.workOrderDate)}</TableCell>
                  <TableCell>{formatDateColumn(row.dateFinished)}</TableCell>
                  <TableCell>
                    {WAREHOUSE_WORK_ORDER_TYPE_LABELS[row.workOrderType]}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      value={row.status}
                      label={WORK_ORDER_STATUS_LABELS[row.status]}
                    />
                  </TableCell>
                  <TableCell>{orDash(row.productCode)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.length)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.width)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.thickness)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(row.qtyPlanned ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(row.qtyActual ?? 0))}
                  </TableCell>
                  <TableCell>{orDash(row.stockUnit)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(row.kgPlanned ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(row.kgActual ?? 0))}
                  </TableCell>
                  <TableCell>{orDash(row.fromLocationName)}</TableCell>
                  <TableCell>{orDash(row.toLocationName)}</TableCell>
                  <TableCell>{orDash(row.charge)}</TableCell>
                  <TableCell>{orDash(row.internalCharge)}</TableCell>
                  <TableCell>
                    {row.purchaseOrderId === null
                      ? "—"
                      : `IO${row.purchaseOrderId}`}
                  </TableCell>
                  <TableCell>{orDash(row.stockCategory)}</TableCell>
                  <TableCell>{orDash(row.qualityCode)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.colliCount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

/** The reference's columns, in its order (441/442, order 100629). */
const ProductionWorkOrderTable = ({ rows }: ProductionTableProps) => {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const selected = rows.find((row) => row.uuid === selectedUuid) ?? null;

  return (
    <div className="space-y-2">
      <WorkOrderToolbar productUuid={selected?.productUuid ?? null} />
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">Item</TableHead>
              <TableHead>Workorder</TableHead>
              <TableHead className="text-right">Line</TableHead>
              <TableHead>Workorder date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Option</TableHead>
              <TableHead>Extra options</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Length</TableHead>
              <TableHead className="text-right">Width</TableHead>
              <TableHead className="text-right">Thickness</TableHead>
              <TableHead className="text-right">Qty(p)</TableHead>
              <TableHead className="text-right">Qty(a)</TableHead>
              <TableHead>U(p)</TableHead>
              <TableHead className="text-right">Kg(p)</TableHead>
              <TableHead className="text-right">Kg(a)</TableHead>
              <TableHead>Date finished</TableHead>
              <TableHead>Charge</TableHead>
              <TableHead>Purchase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={19}
                  className="h-16 text-center text-muted-foreground"
                >
                  {EMPTY_PRODUCTION}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.uuid}
                  onClick={() => setSelectedUuid(row.uuid)}
                  className={cn(
                    "cursor-pointer whitespace-nowrap",
                    row.uuid === selectedUuid && "bg-accent",
                  )}
                >
                  <TableCell className="text-right font-medium tabular-nums">
                    {orDash(
                      row.orderLineNumber === null
                        ? null
                        : row.orderLineNumber * 10,
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/production-workorders/${row.workOrderUuid}`}
                      className="text-primary hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {row.workOrderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.lineNumber)}
                  </TableCell>
                  <TableCell>{formatDateColumn(row.workOrderDate)}</TableCell>
                  <TableCell>
                    <StatusBadge
                      value={row.workOrderStatus}
                      label={WORK_ORDER_STATUS_LABELS[row.workOrderStatus]}
                    />
                  </TableCell>
                  <TableCell>
                    {row.workOrderOption
                      ? MACHINE_OPTION_LABELS[row.workOrderOption]
                      : "—"}
                  </TableCell>
                  <TableCell>{orDash(row.extraOptions)}</TableCell>
                  <TableCell>{orDash(row.productCode)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.length)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.width)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.thickness)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(row.qtyPlanned ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(row.qtyActual ?? 0))}
                  </TableCell>
                  <TableCell>
                    {row.unitPlanned ? STOCK_UNIT_LABELS[row.unitPlanned] : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(row.kgPlanned ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(row.kgActual ?? 0))}
                  </TableCell>
                  <TableCell>{formatDateColumn(row.dateFinished)}</TableCell>
                  <TableCell>{orDash(row.charge)}</TableCell>
                  <TableCell>
                    {row.purchaseOrderId === null
                      ? "—"
                      : `IO${row.purchaseOrderId}`}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

/**
 * The transport panel, with `Bill of lading` beside `Trip`.
 *
 * Those two are not the same thing and the capture is what settled it: three
 * lines of order `100742` share bill of lading `300804` on one journey. The
 * trip is the lorry's day; the bill of lading is the paperwork for one drop on
 * it. Columns and toolbar as O108309 printed them (16-10-2026): a row raised
 * at Make final reads its delivery date as its `Trip` until a trip is
 * planned, Qty(a) and Kg(a) what its picking put on `Laad`, and the lot's
 * charge once picked.
 */
export const TransportWorkOrderTable = ({ rows }: TransportTableProps) => {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const selected = rows.find((row) => row.uuid === selectedUuid) ?? null;

  return (
    <div className="space-y-2">
      <WorkOrderToolbar productUuid={selected?.productUuid ?? null} withView />
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="whitespace-nowrap">
              <TableHead>Item</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Quality code</TableHead>
              <TableHead>Stock category</TableHead>
              <TableHead className="text-right">Length</TableHead>
              <TableHead className="text-right">Width</TableHead>
              <TableHead className="text-right">Thickness</TableHead>
              <TableHead>Delivery date</TableHead>
              <TableHead>Trip</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Bill of lading</TableHead>
              <TableHead className="text-right">Qty(p)</TableHead>
              <TableHead className="text-right">Qty(a)</TableHead>
              <TableHead className="text-right">Qty(loaded)</TableHead>
              <TableHead>U(p)</TableHead>
              <TableHead className="text-right">Kg(p)</TableHead>
              <TableHead className="text-right">Kg(a)</TableHead>
              <TableHead>U(loaded)</TableHead>
              <TableHead>Charge</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={22}
                  className="h-16 text-center text-muted-foreground"
                >
                  {EMPTY_TRANSPORT}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const unit = row.lineUnit ? STOCK_UNIT_LABELS[row.lineUnit] : "—";
                return (
                  <TableRow
                    key={row.uuid}
                    onClick={() => setSelectedUuid(row.uuid)}
                    className={cn(
                      "cursor-pointer whitespace-nowrap",
                      row.uuid === selectedUuid && "bg-accent",
                    )}
                  >
                    <TableCell className="font-medium">
                      {row.orderLineNumber === null
                        ? "—"
                        : row.orderLineNumber * 10}
                    </TableCell>
                    <TableCell>
                      {row.productCodeResolved ?? row.productCode ?? "—"}
                    </TableCell>
                    <TableCell>{orDash(row.productName)}</TableCell>
                    <TableCell>{orDash(row.quality)}</TableCell>
                    <TableCell>{orDash(row.stockCategory)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(row.lengthMm)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(row.widthMm)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(row.thicknessMm)}
                    </TableCell>
                    <TableCell>
                      {formatDateColumn(row.lineDeliveryDate ?? row.tripDate)}
                    </TableCell>
                    <TableCell>
                      {row.tripNumber ?? formatDateColumn(row.tripDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={row.status}
                        label={TRIP_STATUS_LABELS[row.status]}
                      />
                    </TableCell>
                    <TableCell>{row.vehicle ?? "—"}</TableCell>
                    <TableCell>
                      {TRANSPORT_DIRECTION_LABELS[row.direction]}
                    </TableCell>
                    <TableCell>{row.billOfLading ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(row.qtyPlanned ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(row.qtyActual ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(row.qtyLoaded ?? 0))}
                    </TableCell>
                    <TableCell>{unit}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(row.kgPlanned ?? 0))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(row.kgActual ?? 0))}
                    </TableCell>
                    <TableCell>{unit}</TableCell>
                    <TableCell>{orDash(row.charge)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

/**
 * `Workorders` — three panels, and the only place the order says how it reaches
 * the warehouse, the saw and the lorry.
 *
 * Scoped to the ORDER, not to the selected line: every panel below the order
 * lines follows the highlighted line, these three do not. Each row still names
 * its order line in `Item`, which is what ties a pick back to what was sold.
 */
export const OrderWorkOrdersPanel = ({ workOrders }: Props) => (
  <div className="space-y-2">
    <CollapsibleSection
      title="Warehouse workorders"
      summary={`${workOrders.warehouse.length} ${pluralize(workOrders.warehouse.length, "line")}`}
    >
      <WarehouseWorkOrderTable rows={workOrders.warehouse} />
    </CollapsibleSection>
    <CollapsibleSection
      title="Production workorders"
      summary={`${workOrders.production.length} ${pluralize(workOrders.production.length, "line")}`}
    >
      <ProductionWorkOrderTable rows={workOrders.production} />
    </CollapsibleSection>
    <CollapsibleSection
      title="Transport workorders"
      summary={`${workOrders.transport.length} ${pluralize(workOrders.transport.length, "line")}`}
    >
      <TransportWorkOrderTable rows={workOrders.transport} />
    </CollapsibleSection>
  </div>
);
