import { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  PackageSearch,
  Plus,
  Trash2,
} from "lucide-react";
import {
  OrderLineOptionRow,
  OrderLinePanels,
  OrderLinePreviousOrderRow,
  OrderLinePreviousQuoteRow,
  OrderLineRevenueAndProfit,
  OrderLineStockRow,
  OrderTextRow,
  OrderTransportWorkOrderRow,
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
import { BooleanFlag } from "@/components/ui/boolean-flag";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  cn,
  formatDateColumn,
  formatMoney,
  formatNumber,
  formatPercent,
  orDash,
  PriceCascade,
  pluralize,
  yesNo,
} from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  STOCK_UNIT_LABELS,
  TRIP_STATUS_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
} from "@/lib/labels";

const OPTIONS_NOT_BUILT =
  "Not built: a line's options are fixed when its charges are generated";
const DELIVERIES_NOT_BUILT =
  "Not built: deliveries are planned from the transport work orders";

type Props = {
  panels: OrderLinePanels;
  lineLabel: string;
  /** The order's text lines; the order has no per-line texts. */
  texts: OrderTextRow[];
};

type PricingProps = {
  pricing: PriceCascade;
  basePrice: string | null;
  quantitySurcharge: string | null;
  colorSurcharge: string | null;
  lengthSurcharge: string | null;
  lineDiscount: string | null;
  extraDiscount: string | null;
  groupDiscount: string | null;
  lineDiscountAmount: number;
  extraDiscountAmount: number;
  options: OrderLineOptionRow[];
};

type RevenueProps = {
  revenueAndProfit: OrderLineRevenueAndProfit;
};

type ProfitFigureProps = {
  /** Null where the basis is unknown — printed as a dash, never as € 0,00. */
  profit: number | null;
  revenue: number;
};

type RevenueRowProps = {
  label: string;
  revenue: number;
  app: number;
  fsp: number | null;
  repl: number;
  emphasis?: boolean;
};

type OptionsProps = {
  rows: OrderLineOptionRow[];
};

type DeliveriesProps = {
  rows: OrderTransportWorkOrderRow[];
  blocked: boolean;
  options: string | null;
  unit: OrderLinePanels["line"]["unit"];
};

type TextLinesProps = {
  rows: OrderTextRow[];
};

type StockProps = {
  rows: OrderLineStockRow[];
};

type PreviousOrdersProps = {
  rows: OrderLinePreviousOrderRow[];
};

type PreviousQuotesProps = {
  rows: OrderLinePreviousQuoteRow[];
};

type PanelToolbarProps = {
  children: ReactNode;
};

const dimensions = (
  length: number | null,
  width: number | null,
  thickness: string | null,
): string =>
  [thickness, width, length].filter((part) => part !== null).join(" × ") || "—";

/** Money plus the share of revenue it is, e.g. "€ 508,05 (7,09%)". */
const ProfitFigure = ({ profit, revenue }: ProfitFigureProps) =>
  profit === null ? (
    <span className="text-muted-foreground">—</span>
  ) : (
    <span className="tabular-nums">
      {formatMoney(profit)}{" "}
      <span className="text-muted-foreground">
        ({formatPercent(revenue === 0 ? 0 : (profit / revenue) * 100)})
      </span>
    </span>
  );

const PanelToolbar = ({ children }: PanelToolbarProps) => (
  <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 px-2 py-1">
    {children}
  </div>
);

/**
 * `Options` — what is charged on top of the selected line's material.
 *
 * Read-only: there is no action that adds or removes one option on one line,
 * so `New · Delete · Earlier · Later` are drawn greyed, the way the reference
 * greys them on an invoiced order (100629, 8-10-2026).
 */
const OptionsPanel = ({ rows }: OptionsProps) => (
  <div className="space-y-2">
    <PanelToolbar>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled
        title={OPTIONS_NOT_BUILT}
      >
        <Plus className="size-4" />
        New
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled
        title={OPTIONS_NOT_BUILT}
      >
        <Trash2 className="size-4" />
        Delete
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled
        title={OPTIONS_NOT_BUILT}
      >
        <ArrowUp className="size-4" />
        Earlier
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled
        title={OPTIONS_NOT_BUILT}
      >
        <ArrowDown className="size-4" />
        Later
      </Button>
    </PanelToolbar>
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">Sort</TableHead>
            <TableHead>Option</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>U</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead>Per</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Purchase price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="h-16 text-center text-muted-foreground"
              >
                No options on this line.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={row.uuid} className="whitespace-nowrap">
                <TableCell className="text-right tabular-nums">
                  {(index + 1) * 10}
                </TableCell>
                <TableCell>{orDash(row.optionName ?? row.optionCode)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(Number(row.quantity ?? 0))}
                </TableCell>
                <TableCell>
                  {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(Number(row.price ?? 0))}
                </TableCell>
                <TableCell>{orDash(row.priceUnit)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(Number(row.amount ?? 0))}
                </TableCell>
                <TableCell className="text-right">
                  <ProfitFigure
                    profit={Number(row.profit ?? 0)}
                    revenue={Number(row.amount ?? 0)}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(Number(row.costPrice ?? 0))}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);

/**
 * `Deliveries` — how the selected line goes out, one row per drop, in the
 * reference's columns (100629, 8-10-2026). `Blocked`, `Options` and `U` are the
 * line's own; the rest come off the transport line that carries it.
 */
const DeliveriesPanel = ({ rows, blocked, options, unit }: DeliveriesProps) => (
  <div className="space-y-2">
    <PanelToolbar>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled
        title={DELIVERIES_NOT_BUILT}
      >
        <Plus className="size-4" />
        New
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled
        title={DELIVERIES_NOT_BUILT}
      >
        <Trash2 className="size-4" />
        Delete
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled
        title="Not built: PAC"
      >
        PAC
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled
        title="Not built: stock is chosen when the line is entered"
      >
        <PackageSearch className="size-4" />
        Select stock
      </Button>
    </PanelToolbar>
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Blocked</TableHead>
            <TableHead>Delivery date</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Length</TableHead>
            <TableHead className="text-right">Width</TableHead>
            <TableHead className="text-right">Thickness</TableHead>
            <TableHead className="text-right">Kg (p)</TableHead>
            <TableHead>Options</TableHead>
            <TableHead>U</TableHead>
            <TableHead className="text-right">Qty (p)</TableHead>
            <TableHead className="text-right">Qty (a)</TableHead>
            <TableHead className="text-right">Kg (a)</TableHead>
            <TableHead>Bill of lading</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={14}
                className="h-16 text-center text-muted-foreground"
              >
                No deliveries planned for this line.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.uuid} className="whitespace-nowrap">
                <TableCell>
                  <BooleanFlag on={blocked} label="Blocked" />
                </TableCell>
                <TableCell>{formatDateColumn(row.tripDate)}</TableCell>
                <TableCell>
                  {orDash(row.productCodeResolved ?? row.productCode)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {orDash(row.lengthMm)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {orDash(row.widthMm)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {orDash(row.thicknessMm)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(Number(row.kgPlanned ?? 0))}
                </TableCell>
                <TableCell>{orDash(options)}</TableCell>
                <TableCell>{unit ? STOCK_UNIT_LABELS[unit] : "—"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(Number(row.qtyPlanned ?? 0))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(Number(row.qtyActual ?? 0))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(Number(row.kgActual ?? 0))}
                </TableCell>
                <TableCell>{orDash(row.billOfLading)}</TableCell>
                <TableCell>
                  <StatusBadge
                    value={row.status}
                    label={TRIP_STATUS_LABELS[row.status]}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);

/** `Text lines` — the texts printed on the order's documents. */
const TextLinesPanel = ({ rows }: TextLinesProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Title</TableHead>
        <TableHead>Text</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={2}
            className="h-16 text-center text-muted-foreground"
          >
            No text lines on this order.
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">{row.title}</TableCell>
            <TableCell className="whitespace-pre-wrap">
              {row.textBlock}
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

/**
 * `Pricing` — the build-up on the left, the discount cascade on the right, and
 * the line's option prices beside them.
 *
 * Laid out the way the reference lays it out, because the layout IS the finding:
 * four additive components reach a gross price, then line and extra discount
 * subtotal together before the group discount applies to what is left. That
 * order of operations is why the three percentages do not simply add up.
 *
 * A line whose price was typed rather than built up shows a gross price with an
 * empty build-up above it — which is exactly what order `100742` does — so the
 * zero components are a true reading, not a missing one.
 */
const PricingPanel = ({
  pricing,
  basePrice,
  quantitySurcharge,
  colorSurcharge,
  lengthSurcharge,
  lineDiscount,
  extraDiscount,
  groupDiscount,
  lineDiscountAmount,
  extraDiscountAmount,
  options,
}: PricingProps) => (
  <div className="grid gap-6 xl:grid-cols-2">
    <div className="space-y-3">
      <label
        className="flex cursor-not-allowed items-center gap-2 text-sm text-muted-foreground"
        title="Not built: the price setting is not transferred to the order line"
      >
        <input type="checkbox" checked={false} readOnly disabled />
        Transfer price setting to order line
      </label>
      <div className="grid gap-6 sm:grid-cols-2">
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Base price</dt>
            <dd className="tabular-nums">
              {formatMoney(Number(basePrice ?? 0))}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Quantity surcharge</dt>
            <dd className="tabular-nums">
              {formatMoney(Number(quantitySurcharge ?? 0))}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Colour surcharge</dt>
            <dd className="tabular-nums">
              {formatMoney(Number(colorSurcharge ?? 0))}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Length surcharge</dt>
            <dd className="tabular-nums">
              {formatMoney(Number(lengthSurcharge ?? 0))}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t pt-1.5 font-medium">
            <dt>Gross price</dt>
            <dd className="tabular-nums">{formatMoney(pricing.grossPrice)}</dd>
          </div>
        </dl>

        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              Line discount{" "}
              <span className="tabular-nums">
                {formatPercent(Number(lineDiscount ?? 0))}
              </span>
            </dt>
            <dd className="tabular-nums">{formatMoney(lineDiscountAmount)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              Extra discount{" "}
              <span className="tabular-nums">
                {formatPercent(Number(extraDiscount ?? 0))}
              </span>
            </dt>
            <dd className="tabular-nums">{formatMoney(extraDiscountAmount)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t pt-1.5">
            <dt className="text-muted-foreground">
              Line discount total{" "}
              <span className="tabular-nums">
                {formatPercent(pricing.lineDiscountTotalPercent)}
              </span>
            </dt>
            <dd className="tabular-nums">
              {formatMoney(pricing.lineDiscountTotalAmount)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              Group discount{" "}
              <span className="tabular-nums">
                {formatPercent(Number(groupDiscount ?? 0))}
              </span>
            </dt>
            <dd className="tabular-nums">
              {formatMoney(pricing.groupDiscountAmount)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t pt-1.5 font-medium">
            <dt>Net price</dt>
            <dd className="tabular-nums">{formatMoney(pricing.netPrice)}</dd>
          </div>
        </dl>
      </div>
    </div>

    <div className="space-y-3">
      <label
        className="flex cursor-not-allowed items-center gap-2 text-sm text-muted-foreground"
        title="Not built: the pricing determination is not transferred to the options"
      >
        <input type="checkbox" checked={false} readOnly disabled />
        Transfer pricing determination to options
      </label>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Option</TableHead>
              <TableHead className="text-right">Net price</TableHead>
              <TableHead>U</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {options.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-12 text-center text-muted-foreground"
                >
                  No options on this line.
                </TableCell>
              </TableRow>
            ) : (
              options.map((option) => (
                <TableRow key={option.uuid}>
                  <TableCell>
                    {orDash(option.optionName ?? option.optionCode)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(option.price ?? 0))}
                  </TableCell>
                  <TableCell>{orDash(option.priceUnit)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
);

const RevenueRow = ({
  label,
  revenue,
  app,
  fsp,
  repl,
  emphasis = false,
}: RevenueRowProps) => (
  <TableRow className={cn(emphasis && "border-t-2 font-medium")}>
    <TableCell>{label}</TableCell>
    <TableCell className="text-right tabular-nums">
      {formatMoney(revenue)}
    </TableCell>
    <TableCell className="text-right">
      <ProfitFigure profit={app} revenue={revenue} />
    </TableCell>
    <TableCell className="text-right">
      <ProfitFigure profit={fsp} revenue={revenue} />
    </TableCell>
    <TableCell className="text-right">
      <ProfitFigure profit={repl} revenue={revenue} />
    </TableCell>
    {/* LIP: what it stands for is still unknown (K4), and a column of zeros
        would read as an answer — so the cell says nothing is known. */}
    <TableCell className="text-right">
      <ProfitFigure profit={null} revenue={revenue} />
    </TableCell>
  </TableRow>
);

/**
 * `Revenue+Profit` for the selected line — the reference's 5-column grid
 * (316, order 100785): `Revenue · Profit w.r.t. APP · FSP · Repl. price · LIP`
 * against `Materials · Options · Total`.
 *
 * An option is charged at one agreed cost, so its profit is the same figure
 * whichever basis the material is measured against.
 */
const RevenueAndProfitPanel = ({ revenueAndProfit }: RevenueProps) => {
  const {
    revenue,
    costPrice,
    profit,
    profitFsp,
    profitReplPrice,
    replacementCost,
    optionsRevenue,
    optionsProfit,
    profitTooLow,
  } = revenueAndProfit;
  // A product with no settlement price reads € 0,00 on the reference; here it
  // is a dash, so a missing FSP is not mistaken for a zero margin.
  const materialsFsp = profitFsp ? profitFsp : null;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">
                Profit w.r.t. APP ({formatMoney(costPrice)})
              </TableHead>
              <TableHead className="text-right">Profit w.r.t. FSP</TableHead>
              <TableHead className="text-right">
                Profit w.r.t. Repl. price ({formatMoney(replacementCost)})
              </TableHead>
              <TableHead className="text-right">Profit w.r.t. LIP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <RevenueRow
              label="Materials"
              revenue={revenue}
              app={profit}
              fsp={materialsFsp}
              repl={profitReplPrice}
            />
            <RevenueRow
              label="Options"
              revenue={optionsRevenue}
              app={optionsProfit}
              fsp={materialsFsp === null ? null : optionsProfit}
              repl={optionsProfit}
            />
            <RevenueRow
              label="Total"
              revenue={revenue + optionsRevenue}
              app={profit + optionsProfit}
              fsp={materialsFsp === null ? null : materialsFsp + optionsProfit}
              repl={profitReplPrice + optionsProfit}
              emphasis
            />
          </TableBody>
        </Table>
      </div>
      {profitTooLow && (
        <p className="text-sm text-destructive">
          The margin is under the product group&apos;s floor.
        </p>
      )}
    </div>
  );
};

/**
 * `Stock` — what is on the shelf for this line's article.
 *
 * Three quantities, and only one of them is arithmetic: `Available` is
 * `Technical − Reserved`, confirmed on the one captured row where it bites
 * (64 technical, 64 reserved, 0 available on the `Laad` lot).
 */
const StockPanel = ({ rows }: StockProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Code</TableHead>
        <TableHead>Article</TableHead>
        <TableHead>Dimensions</TableHead>
        <TableHead>Location</TableHead>
        <TableHead>Location type</TableHead>
        <TableHead>Blocked</TableHead>
        <TableHead className="text-right">Technical</TableHead>
        <TableHead className="text-right">Reserved</TableHead>
        <TableHead className="text-right">Available</TableHead>
        <TableHead className="text-right">Kg</TableHead>
        <TableHead>Quality</TableHead>
        <TableHead>Charge</TableHead>
        <TableHead>Internal charge</TableHead>
        <TableHead>Internal batch</TableHead>
        <TableHead>Supplier</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={15}
            className="h-16 text-center text-muted-foreground"
          >
            No stock on hand for this article.
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              {row.productCode ?? "—"}
            </TableCell>
            <TableCell>{row.productName ?? "—"}</TableCell>
            <TableCell>
              {dimensions(row.lengthMm, row.widthMm, row.thicknessMm)}
            </TableCell>
            <TableCell>{row.locationName ?? "—"}</TableCell>
            <TableCell>
              {row.locationType
                ? WAREHOUSE_LOCATION_TYPE_LABELS[row.locationType]
                : "—"}
            </TableCell>
            <TableCell>{yesNo(row.blocked)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.quantity}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.reservedQuantity}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.availableQuantity}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.quantityKg ?? "—"}
            </TableCell>
            <TableCell>{row.quality ?? "—"}</TableCell>
            <TableCell>{row.charge ?? "—"}</TableCell>
            <TableCell>{row.internalCharge ?? "—"}</TableCell>
            <TableCell>{row.internalBatch ?? "—"}</TableCell>
            <TableCell>{row.supplierName ?? "—"}</TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

/**
 * `Previous orders` — what this customer paid for this article last time.
 *
 * The panel that sells: on the captured order the same customer had bought the
 * same plate at the same € 3.640,00 four days earlier, which is very likely why
 * the seller typed that price rather than building it up.
 */
const PreviousOrdersPanel = ({ rows }: PreviousOrdersProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Order / line</TableHead>
        <TableHead>Created</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Qty</TableHead>
        <TableHead>Unit</TableHead>
        <TableHead>Dimensions</TableHead>
        <TableHead className="text-right">Weight</TableHead>
        <TableHead className="text-right">Gross price</TableHead>
        <TableHead className="text-right">Net price</TableHead>
        <TableHead className="text-right">Amount</TableHead>
        <TableHead className="text-right">Days in system</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={11}
            className="h-16 text-center text-muted-foreground"
          >
            This customer has not ordered this article before.
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => (
          <TableRow key={`${row.orderUuid}-${row.lineNumber}`}>
            <TableCell>
              <Link
                href={`/orders/${row.orderUuid}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {row.orderId}
                {row.lineNumber === null ? "" : ` / ${row.lineNumber}`}
              </Link>
            </TableCell>
            <TableCell>
              {new Date(row.createdAt).toLocaleDateString("en-GB")}
            </TableCell>
            <TableCell>
              <StatusBadge
                value={row.status}
                label={row.status ? ORDER_LINE_STATUS_LABELS[row.status] : null}
              />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.quantity}
            </TableCell>
            <TableCell>
              {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
            </TableCell>
            <TableCell>
              {dimensions(row.lengthMm, row.widthMm, row.thicknessMm)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.weightKg ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.grossPrice ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.netPrice ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.amount ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.daysInSystem}
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

const PreviousQuotesPanel = ({ rows }: PreviousQuotesProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Quote / line</TableHead>
        <TableHead>Created</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Qty</TableHead>
        <TableHead>Unit</TableHead>
        <TableHead>Dimensions</TableHead>
        <TableHead className="text-right">Weight</TableHead>
        <TableHead className="text-right">Gross price</TableHead>
        <TableHead className="text-right">Net price</TableHead>
        <TableHead className="text-right">Amount</TableHead>
        <TableHead className="text-right">Days in system</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={11}
            className="h-16 text-center text-muted-foreground"
          >
            This customer has not been quoted this article before.
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => (
          <TableRow key={`${row.quoteUuid}-${row.lineNumber}`}>
            <TableCell>
              <Link
                href={`/quotes/${row.quoteUuid}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {row.quoteId}
                {row.lineNumber === null ? "" : ` / ${row.lineNumber}`}
              </Link>
            </TableCell>
            <TableCell>
              {new Date(row.createdAt).toLocaleDateString("en-GB")}
            </TableCell>
            <TableCell>
              <StatusBadge
                value={row.status}
                label={row.status ? ORDER_LINE_STATUS_LABELS[row.status] : null}
              />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.quantity}
            </TableCell>
            <TableCell>
              {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
            </TableCell>
            <TableCell>
              {dimensions(row.lengthMm, row.widthMm, row.thicknessMm)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.weightKg ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.grossPrice ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.netPrice ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.amount ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.daysInSystem}
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

/**
 * Every panel that follows the SELECTED order line, in the reference's order
 * (316, 438): Options, Deliveries, Stock, Text lines, Revenue+Profit, Pricing,
 * Stock other affiliates, Previous orders, Previous quotes.
 *
 * This is the structural finding of the G1 capture: with one line highlighted
 * on a nine-line order, `Deliveries` reads one delivery and `Revenue+Profit`
 * reads that line's amount. A seller works one line at a time — picks it, then
 * asks what stock there is, what this customer paid before, and what has
 * shipped. See `docs/reference-system/order-detail.md` §10.
 */
export const OrderLinePanelsView = ({
  panels,
  lineLabel,
  texts,
}: Props) => {
  const { revenueAndProfit } = panels;
  const totalRevenue = revenueAndProfit.revenue + revenueAndProfit.optionsRevenue;
  const totalProfit = revenueAndProfit.profit + revenueAndProfit.optionsProfit;

  return (
    <div className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">
        Line {lineLabel}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          the panels below follow the selected line
        </span>
      </h2>

      <CollapsibleSection
        title="Options"
        summary={
          panels.options.length === 0
            ? "No options"
            : panels.options
                .map((option) => option.optionName ?? option.optionCode)
                .filter(Boolean)
                .join(", ")
        }
        defaultOpen={panels.options.length > 0}
      >
        <OptionsPanel rows={panels.options} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Deliveries"
        summary={`${panels.deliveries.length} ${pluralize(
          panels.deliveries.length,
          "delivery",
          "deliveries",
        )}`}
      >
        <DeliveriesPanel
          rows={panels.deliveries}
          blocked={panels.line.transportBlock ?? false}
          options={panels.line.options}
          unit={panels.line.unit}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Stock"
        summary={`${panels.stock.length} ${pluralize(panels.stock.length, "lot")}`}
      >
        <StockPanel rows={panels.stock} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Text lines"
        summary={`${texts.length} ${pluralize(texts.length, "text")}`}
      >
        <TextLinesPanel rows={texts} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Revenue + Profit"
        summary={`CURRENT APP: ${formatMoney(
          revenueAndProfit.costPrice,
        )}  Profit w.r.t. CURRENT APP: ${formatMoney(totalProfit)} (${formatPercent(
          totalRevenue === 0 ? 0 : (totalProfit / totalRevenue) * 100,
        )})`}
      >
        <RevenueAndProfitPanel revenueAndProfit={revenueAndProfit} />
      </CollapsibleSection>

      <CollapsibleSection title="Pricing">
        <PricingPanel
          pricing={panels.pricing}
          basePrice={panels.line.basePrice}
          quantitySurcharge={panels.line.quantitySurcharge}
          colorSurcharge={panels.line.colorSurcharge}
          lengthSurcharge={panels.line.lengthSurcharge}
          lineDiscount={panels.line.lineDiscount}
          extraDiscount={panels.line.extraDiscount}
          groupDiscount={panels.line.groupDiscount}
          lineDiscountAmount={panels.lineDiscountAmount}
          extraDiscountAmount={panels.extraDiscountAmount}
          options={panels.options}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Stock other affiliates" summary="Not built">
        <p className="text-sm text-muted-foreground">
          Not built: this installation holds one affiliate&apos;s stock, so
          there is no other affiliate to look in.
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        title="Previous orders"
        summary={`${panels.previousOrders.length} ${pluralize(
          panels.previousOrders.length,
          "line",
        )}`}
      >
        <PreviousOrdersPanel rows={panels.previousOrders} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Previous quotes"
        summary={`${panels.previousQuotes.length} ${pluralize(
          panels.previousQuotes.length,
          "line",
        )}`}
      >
        <PreviousQuotesPanel rows={panels.previousQuotes} />
      </CollapsibleSection>
    </div>
  );
};
