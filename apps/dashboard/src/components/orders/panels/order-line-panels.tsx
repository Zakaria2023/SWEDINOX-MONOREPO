import Link from "next/link";
import {
  OrderLinePanels,
  OrderLinePreviousOrderRow,
  OrderLinePreviousQuoteRow,
  OrderLineRevenueAndProfit,
  OrderLineStockRow,
} from "@/app/(dashboard)/orders/[uuid]/actions";
import { TransportWorkOrderTable } from "@/components/orders/panels/order-work-orders-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { DetailField } from "@/components/ui/detail-field";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  cn,
  formatMoney,
  formatPercent,
  PriceCascade,
  pluralize,
  yesNo,
} from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  STOCK_UNIT_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  panels: OrderLinePanels;
  lineLabel: string;
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
};

type RevenueProps = {
  revenueAndProfit: OrderLineRevenueAndProfit;
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

const dimensions = (
  length: number | null,
  width: number | null,
  thickness: string | null,
): string =>
  [thickness, width, length].filter((part) => part !== null).join(" × ") || "—";

/**
 * `Pricing` — the build-up on the left, the discount cascade on the right.
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
}: PricingProps) => (
  <div className="grid gap-6 sm:grid-cols-2">
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Base price</dt>
        <dd className="tabular-nums">{formatMoney(Number(basePrice ?? 0))}</dd>
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
        <dd className="tabular-nums" />
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">
          Extra discount{" "}
          <span className="tabular-nums">
            {formatPercent(Number(extraDiscount ?? 0))}
          </span>
        </dt>
        <dd className="tabular-nums" />
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
);

/**
 * `Revenue+Profit` for the selected line — the panel that proved the scoping.
 *
 * On a nine-line order it reads one line's amount, not the order's total, which
 * is how the line scope was established in the first place.
 */
const RevenueAndProfitPanel = ({ revenueAndProfit }: RevenueProps) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
    <DetailField
      label="Revenue"
      value={formatMoney(revenueAndProfit.revenue)}
    />
    <DetailField
      label="Cost"
      value={formatMoney(revenueAndProfit.costAmount)}
    />
    <DetailField label="Profit" value={formatMoney(revenueAndProfit.profit)} />
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Margin
      </p>
      <p
        className={cn(
          "text-sm tabular-nums",
          revenueAndProfit.profitTooLow && "text-destructive",
        )}
      >
        {formatPercent(revenueAndProfit.profitMargin)}
      </p>
    </div>
    <DetailField
      label="Replacement price"
      value={formatMoney(revenueAndProfit.replacementCost)}
    />
    <DetailField
      label="Profit on replacement"
      value={formatMoney(revenueAndProfit.profitReplPrice)}
    />
    {/* The third basis the reference measures against. Its own panel prints
        four — APP, FSP, replacement price and LIP — and shows FSP as € 0,00 on
        a product that carries no settlement price, which is what an em dash
        says here. LIP is absent on purpose: what it stands for is still
        unknown, and a column of zeros would read as an answer. */}
    <DetailField
      label="Profit on FSP"
      value={
        revenueAndProfit.profitFsp
          ? formatMoney(revenueAndProfit.profitFsp)
          : "—"
      }
    />
    <DetailField
      label="Margin too low"
      value={yesNo(revenueAndProfit.profitTooLow)}
    />
  </div>
);

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
 * Every panel that follows the SELECTED order line.
 *
 * This is the structural finding of the G1 capture: with one line highlighted
 * on a nine-line order, `Deliveries` reads one delivery and `Revenue+Profit`
 * reads that line's amount. A seller works one line at a time — picks it, then
 * asks what stock there is, what this customer paid before, and what has
 * shipped. See `docs/reference-system/order-detail.md` §10.
 */
export const OrderLinePanelsView = ({ panels, lineLabel }: Props) => (
  <div className="space-y-3">
    <h2 className="border-b pb-2 text-base font-semibold">
      Line {lineLabel}
      <span className="ml-2 text-xs font-normal text-muted-foreground">
        the panels below follow the selected line
      </span>
    </h2>

    <CollapsibleSection title="Pricing" defaultOpen>
      <PricingPanel
        pricing={panels.pricing}
        basePrice={panels.line.basePrice}
        quantitySurcharge={panels.line.quantitySurcharge}
        colorSurcharge={panels.line.colorSurcharge}
        lengthSurcharge={panels.line.lengthSurcharge}
        lineDiscount={panels.line.lineDiscount}
        extraDiscount={panels.line.extraDiscount}
        groupDiscount={panels.line.groupDiscount}
      />
    </CollapsibleSection>

    <CollapsibleSection
      title="Revenue + Profit"
      summary={formatMoney(panels.revenueAndProfit.revenue)}
    >
      <RevenueAndProfitPanel revenueAndProfit={panels.revenueAndProfit} />
    </CollapsibleSection>

    <CollapsibleSection
      title="Deliveries"
      summary={`${panels.deliveries.length} ${pluralize(
        panels.deliveries.length,
        "delivery",
        "deliveries",
      )}`}
    >
      <TransportWorkOrderTable rows={panels.deliveries} />
    </CollapsibleSection>

    <CollapsibleSection
      title="Stock"
      summary={`${panels.stock.length} ${pluralize(panels.stock.length, "lot")}`}
    >
      <StockPanel rows={panels.stock} />
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
