import {
  OrderProductionWorkOrderRow,
  OrderTransportWorkOrderRow,
  OrderWarehouseWorkOrderRow,
  OrderWorkOrders,
} from "@/app/(dashboard)/orders/[uuid]/actions";
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
import { formatDateColumn, pluralize } from "@/lib/helpers";
import {
  TRANSPORT_DIRECTION_LABELS,
  TRIP_STATUS_LABELS,
  WAREHOUSE_WORK_ORDER_TYPE_LABELS,
  WORK_ORDER_STATUS_LABELS,
} from "@/lib/labels";

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

const EMPTY_WAREHOUSE =
  "No warehouse work orders — nothing has been picked yet.";
const EMPTY_PRODUCTION =
  "No production work orders — nothing on this order is cut.";
const EMPTY_TRANSPORT =
  "No transport work orders — nothing is planned onto a lorry.";

const WarehouseWorkOrderTable = ({ rows }: WarehouseTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Item</TableHead>
        <TableHead>Work order</TableHead>
        <TableHead>Line</TableHead>
        <TableHead>Date</TableHead>
        <TableHead>Type</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Qty (p)</TableHead>
        <TableHead className="text-right">Qty (a)</TableHead>
        <TableHead className="text-right">Kg (p)</TableHead>
        <TableHead className="text-right">Kg (a)</TableHead>
        <TableHead>From</TableHead>
        <TableHead>To</TableHead>
        <TableHead>Charge</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={13}
            className="h-16 text-center text-muted-foreground"
          >
            {EMPTY_WAREHOUSE}
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              {row.orderLineNumber ?? "—"}
            </TableCell>
            <TableCell>{row.workOrderNumber}</TableCell>
            <TableCell>{row.lineNumber ?? "—"}</TableCell>
            <TableCell>{formatDateColumn(row.workOrderDate)}</TableCell>
            <TableCell>
              {WAREHOUSE_WORK_ORDER_TYPE_LABELS[row.workOrderType]}
            </TableCell>
            <TableCell>
              <StatusBadge
                value={row.status}
                label={WORK_ORDER_STATUS_LABELS[row.status]}
              />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.qtyPlanned ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.qtyActual ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.kgPlanned ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.kgActual ?? "—"}
            </TableCell>
            <TableCell>{row.fromLocationName ?? "—"}</TableCell>
            <TableCell>{row.toLocationName ?? "—"}</TableCell>
            <TableCell>{row.charge ?? "—"}</TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

const ProductionWorkOrderTable = ({ rows }: ProductionTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Item</TableHead>
        <TableHead>Work order</TableHead>
        <TableHead>Line</TableHead>
        <TableHead>Date</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Qty (p)</TableHead>
        <TableHead className="text-right">Qty (a)</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={7}
            className="h-16 text-center text-muted-foreground"
          >
            {EMPTY_PRODUCTION}
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              {row.orderLineNumber ?? "—"}
            </TableCell>
            <TableCell>{row.workOrderNumber}</TableCell>
            <TableCell>{row.lineNumber ?? "—"}</TableCell>
            <TableCell>{formatDateColumn(row.workOrderDate)}</TableCell>
            <TableCell>
              <StatusBadge
                value={row.workOrderStatus}
                label={WORK_ORDER_STATUS_LABELS[row.workOrderStatus]}
              />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.qtyPlanned ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.qtyActual ?? "—"}
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

/**
 * The transport panel, with `Bill of lading` beside `Trip`.
 *
 * Those two are not the same thing and the capture is what settled it: three
 * lines of order `100742` share bill of lading `300804` on one journey. The
 * trip is the lorry's day; the bill of lading is the paperwork for one drop on
 * it. `Qty (loaded)` is a third quantity again, and reads zero until the goods
 * are actually on the vehicle.
 */
export const TransportWorkOrderTable = ({ rows }: TransportTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Item</TableHead>
        <TableHead>Product</TableHead>
        <TableHead>Delivery date</TableHead>
        <TableHead>Trip</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Vehicle</TableHead>
        <TableHead>Direction</TableHead>
        <TableHead>Bill of lading</TableHead>
        <TableHead className="text-right">Qty (p)</TableHead>
        <TableHead className="text-right">Qty (a)</TableHead>
        <TableHead className="text-right">Qty (loaded)</TableHead>
        <TableHead className="text-right">Kg (p)</TableHead>
        <TableHead className="text-right">Kg (a)</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={13}
            className="h-16 text-center text-muted-foreground"
          >
            {EMPTY_TRANSPORT}
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              {row.orderLineNumber ?? "—"}
            </TableCell>
            <TableCell>
              {row.productCodeResolved ?? row.productCode ?? "—"}
            </TableCell>
            <TableCell>{formatDateColumn(row.tripDate)}</TableCell>
            <TableCell>{row.tripNumber ?? "—"}</TableCell>
            <TableCell>
              <StatusBadge
                value={row.status}
                label={TRIP_STATUS_LABELS[row.status]}
              />
            </TableCell>
            <TableCell>{row.vehicle ?? "—"}</TableCell>
            <TableCell>{TRANSPORT_DIRECTION_LABELS[row.direction]}</TableCell>
            <TableCell>{row.billOfLading ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.qtyPlanned ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.qtyActual ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.qtyLoaded ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.kgPlanned ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.kgActual ?? "—"}
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

/**
 * `Workorders` — three panels, and the only place the order says how it reaches
 * the warehouse, the saw and the lorry.
 *
 * Scoped to the ORDER, not to the selected line: every panel below this one
 * follows the highlighted line, these three do not. Each row still names its
 * order line in `Item`, which is what ties a pick back to what was sold.
 */
export const OrderWorkOrdersPanel = ({ workOrders }: Props) => (
  <CollapsibleSection
    title="Workorders"
    summary={[
      `${workOrders.warehouse.length} ${pluralize(workOrders.warehouse.length, "warehouse order")}`,
      `${workOrders.production.length} ${pluralize(workOrders.production.length, "production order")}`,
      `${workOrders.transport.length} ${pluralize(workOrders.transport.length, "transport order")}`,
    ].join(" · ")}
  >
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Warehouse workorders</h3>
        <WarehouseWorkOrderTable rows={workOrders.warehouse} />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Production workorders</h3>
        <ProductionWorkOrderTable rows={workOrders.production} />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Transport workorders</h3>
        <TransportWorkOrderTable rows={workOrders.transport} />
      </div>
    </div>
  </CollapsibleSection>
);
