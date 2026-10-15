import { WorkOrderDetail } from "@/app/(dashboard)/warehouse-work-orders/actions";
import {
  formatDateColumn,
  formatNumber,
  orDash,
} from "@/lib/helpers";
import { WAREHOUSE_WORK_ORDER_TYPE_LABELS } from "@/lib/labels";

type Props = {
  workOrder: WorkOrderDetail;
  /** `Vrijgeven` prints the stock labels too; `without stock labels` not. */
  withStockLabels: boolean;
};

/**
 * The slip `Vrijgeven` prints: the work order and its lines, as the floor
 * takes it to the rack — then, unless released without them, one stock label
 * per label the line owes (its product decides how many).
 */
export const WorkOrderSlip = ({ workOrder, withStockLabels }: Props) => (
  <main className="mx-auto max-w-4xl space-y-8 bg-background p-10 text-sm text-foreground print:p-0">
    <header className="space-y-1 border-b pb-4">
      <p className="text-2xl font-semibold tracking-tight">
        Warehouse work order {workOrder.number}
      </p>
      <p className="text-muted-foreground">
        {WAREHOUSE_WORK_ORDER_TYPE_LABELS[workOrder.type]} ·{" "}
        {formatDateColumn(workOrder.plannedDate)} ·{" "}
        {orDash(workOrder.warehouseName)}
      </p>
    </header>

    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b text-left">
          <th className="py-1 pe-2">Line</th>
          <th className="py-1 pe-2">Order</th>
          <th className="py-1 pe-2">Product</th>
          <th className="py-1 pe-2 text-right">Length</th>
          <th className="py-1 pe-2 text-right">Width</th>
          <th className="py-1 pe-2 text-right">Thickness</th>
          <th className="py-1 pe-2 text-right">Qty(p)</th>
          <th className="py-1 pe-2 text-right">Kg(p)</th>
          <th className="py-1 pe-2">From</th>
          <th className="py-1 pe-2">To</th>
          <th className="py-1 pe-2">Charge</th>
          <th className="py-1">Internal charge</th>
        </tr>
      </thead>
      <tbody>
        {workOrder.lines.map((line) => (
          <tr key={line.uuid} className="border-b align-top">
            <td className="py-1 pe-2 tabular-nums">{orDash(line.lineNumber)}</td>
            <td className="py-1 pe-2">{orDash(line.orderNumber)}</td>
            <td className="py-1 pe-2">
              {[line.productCode, line.productName].filter(Boolean).join(" — ")}
            </td>
            <td className="py-1 pe-2 text-right tabular-nums">
              {orDash(line.length)}
            </td>
            <td className="py-1 pe-2 text-right tabular-nums">
              {orDash(line.width)}
            </td>
            <td className="py-1 pe-2 text-right tabular-nums">
              {line.thickness === null ? "—" : formatNumber(Number(line.thickness))}
            </td>
            <td className="py-1 pe-2 text-right tabular-nums">
              {formatNumber(Number(line.qtyPlanned ?? 0))}
            </td>
            <td className="py-1 pe-2 text-right tabular-nums">
              {formatNumber(Number(line.kgPlanned ?? 0))}
            </td>
            <td className="py-1 pe-2">{orDash(line.fromLocationName)}</td>
            <td className="py-1 pe-2">{orDash(line.toLocationName)}</td>
            <td className="py-1 pe-2">{orDash(line.charge)}</td>
            <td className="py-1">{orDash(line.internalCharge)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {withStockLabels && (
      <section className="space-y-3 break-before-page">
        <h2 className="text-base font-semibold">Stock labels</h2>
        <div className="grid grid-cols-2 gap-3">
          {workOrder.lines.flatMap((line) =>
            Array.from({ length: Math.max(1, line.stockLabels) }, (_, index) => (
              <div
                key={`${line.uuid}-${index}`}
                className="break-inside-avoid space-y-1 rounded border p-3"
              >
                <p className="text-lg font-semibold">{orDash(line.productCode)}</p>
                <p>{orDash(line.productName)}</p>
                <p className="tabular-nums">
                  {[line.length, line.width, line.thickness]
                    .filter((value) => value !== null && Number(value) > 0)
                    .map((value) => formatNumber(Number(value)))
                    .join(" × ")}
                </p>
                <p>
                  Charge {orDash(line.charge)} · Internal charge{" "}
                  {orDash(line.internalCharge)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Work order {workOrder.number}/{orDash(line.lineNumber)} ·{" "}
                  {orDash(line.orderNumber)}
                </p>
              </div>
            )),
          )}
        </div>
      </section>
    )}
  </main>
);
