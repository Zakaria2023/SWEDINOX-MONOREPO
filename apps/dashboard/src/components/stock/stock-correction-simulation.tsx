import { StockCorrectionSimulation } from "@/app/(dashboard)/stock/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMoney, formatNumber } from "@/lib/helpers";
import {
  STOCK_CORRECTABLE_ATTRIBUTE_LABELS,
  STOCK_MOVEMENT_REASON_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  simulation: StockCorrectionSimulation;
  unit: string;
};

/**
 * The output pane under `Simuleer`: what `OK` would write, without writing it.
 * The lot's figures before and after, then every ledger row — the quantity leg
 * and one `adjust` row per changed attribute.
 */
export const StockCorrectionSimulationPane = ({ simulation, unit }: Props) => {
  const { rows, before, after } = simulation;

  if (!rows || !before || !after) {
    return null;
  }

  const figures = [
    {
      label: `Quantity (${unit})`,
      before: formatNumber(Number(before.quantity)),
      after: formatNumber(Number(after.quantity)),
    },
    {
      label: "Kg",
      before: formatNumber(Number(before.quantityKg ?? 0)),
      after: formatNumber(Number(after.quantityKg ?? 0)),
    },
    {
      label: "Value",
      before: formatMoney(Number(before.valuationEuro ?? 0)),
      after: formatMoney(Number(after.valuationEuro ?? 0)),
    },
  ];

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-3">
      <p className="text-sm font-medium">
        Simulation — nothing has been saved
      </p>

      <div className="grid grid-cols-3 gap-3">
        {figures.map((figure) => (
          <div key={figure.label}>
            <p className="text-xs text-muted-foreground">{figure.label}</p>
            <p className="text-sm tabular-nums">
              {figure.before} → {figure.after}
            </p>
          </div>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Attribute</TableHead>
            <TableHead>Before</TableHead>
            <TableHead>After</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Kg</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.type}-${row.attribute ?? "qty"}-${index}`}>
              <TableCell>{STOCK_MOVEMENT_TYPE_LABELS[row.type]}</TableCell>
              <TableCell>{STOCK_MOVEMENT_REASON_LABELS[row.reason]}</TableCell>
              <TableCell>
                {row.attribute
                  ? STOCK_CORRECTABLE_ATTRIBUTE_LABELS[row.attribute]
                  : "—"}
              </TableCell>
              <TableCell>{row.valueBefore ?? "—"}</TableCell>
              <TableCell>{row.valueAfter ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(row.quantity ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(row.quantityKg ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(Number(row.valueEur ?? 0))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
