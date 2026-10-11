"use client";

import { QuoteLineDetail } from "@/app/(dashboard)/quotes/actions";
import { QuoteLineFigures } from "@/app/(dashboard)/quotes/use-quote-submit";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { formatMoney, formatPercent } from "@/lib/helpers";

// The line-scoped panels this app cannot fill for a quote yet, with the grid
// the reference draws in each (order 100742, 18-9-2026).
const UNBUILT_LINE_PANELS: ReadonlyArray<{ title: string; columns: string[] }> =
  [
    {
      title: "Stock",
      columns: [
        "Code",
        "Article",
        "Dimensions",
        "Location",
        "Technical",
        "Reserved",
        "Available",
        "Quality",
        "Charge",
        "Purchase order",
        "Receipt date",
      ],
    },
    {
      title: "Stock other affiliates",
      columns: ["Affiliate", "Article", "Dimensions", "Available"],
    },
    {
      title: "Previous orders",
      columns: [
        "Order / Line",
        "Creation date",
        "Status",
        "Qty",
        "U",
        "Dimensions",
        "Weight",
        "Gross price",
        "Line discount",
        "Group discount",
        "Net price",
        "Amount",
        "Days in system",
      ],
    },
    {
      title: "Previous quotes",
      columns: [
        "Quote / Line",
        "Creation date",
        "Status",
        "Qty",
        "U",
        "Dimensions",
        "Weight",
        "Gross price",
        "Net price",
        "Amount",
        "Days in system",
      ],
    },
  ];

type Props = {
  /** The selected line's position in the grid, or null. */
  selectedLine: number | null;
  /** The selected line as it was saved — absent for a line not saved yet. */
  savedLine: QuoteLineDetail | undefined;
  figures: QuoteLineFigures | undefined;
};

type MoneyRowProps = {
  label: string;
  value: number | null;
  percent?: number | null;
};

const MoneyRow = ({ label, value, percent }: MoneyRowProps) => (
  <div className="contents">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="text-right tabular-nums">
      {value === null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <>
          {formatMoney(value)}
          {percent !== undefined && percent !== null && (
            <span className="ms-1 text-muted-foreground">
              ({formatPercent(percent)})
            </span>
          )}
        </>
      )}
    </dd>
  </div>
);

/**
 * The panels that follow the selected line rather than the quote — the
 * structural finding of order 100742: pick a line, and `Revenue+Profit`,
 * `Pricing`, `Stock` and the previous orders and quotes answer for it.
 */
export const QuoteLinePanels = ({ selectedLine, savedLine, figures }: Props) => {
  const lineLabel =
    selectedLine === null ? "No line selected" : `Line ${(selectedLine + 1) * 10}`;
  const revenue = figures?.amount ?? 0;
  const ratio = (profit: number) =>
    revenue === 0 ? 0 : (profit / Math.abs(revenue)) * 100;
  const profitReplPrice = savedLine
    ? Number(savedLine.profitReplPrice ?? 0)
    : revenue - (figures?.replacementCost ?? 0);

  return (
    <>
      <CollapsibleSection title="Revenue+Profit" summary={lineLabel}>
        <div className="p-3">
          {figures ? (
            <dl className="grid max-w-xl grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
              <MoneyRow label="Revenue" value={revenue} />
              <MoneyRow
                label="Profit w.r.t. APP"
                value={figures.profit}
                percent={ratio(figures.profit)}
              />
              {/* FSP and replacement-price profit are stored on a saved line;
                  a line typed since has only its list-price preview. */}
              <MoneyRow
                label="Profit w.r.t. FSP"
                value={savedLine ? Number(savedLine.profitFsp ?? 0) : null}
                percent={savedLine ? ratio(Number(savedLine.profitFsp ?? 0)) : null}
              />
              <MoneyRow
                label="Profit w.r.t. Repl. price"
                value={profitReplPrice}
                percent={ratio(profitReplPrice)}
              />
              {/* LIP is a fourth basis the reference prints and nothing here
                  can fill yet. */}
              <MoneyRow label="Profit w.r.t. LIP" value={null} />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a line to see its revenue and profit.
            </p>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Pricing" summary={lineLabel}>
        <div className="p-3">
          {figures ? (
            <div className="grid max-w-3xl gap-x-10 gap-y-4 sm:grid-cols-2">
              {/* The left column builds the gross price up; a quote line
                  stores the answer, not its components, so those read —. */}
              <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
                <MoneyRow label="Base price" value={null} />
                <MoneyRow label="Quantity surcharge" value={null} />
                <MoneyRow label="Color surcharge" value={null} />
                <MoneyRow label="Length surcharge" value={null} />
                <MoneyRow
                  label="Gross Price"
                  value={
                    savedLine
                      ? Number(savedLine.grossPrice ?? 0)
                      : figures.netPrice
                  }
                />
              </dl>
              <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Line discount</dt>
                <dd className="text-right tabular-nums">
                  {formatPercent(Number(savedLine?.lineDiscount ?? 0))}
                </dd>
                <MoneyRow label="Extra discount" value={null} />
                <dt className="text-muted-foreground">Group discount</dt>
                <dd className="text-right tabular-nums">
                  {formatPercent(Number(savedLine?.groupDiscount ?? 0))}
                </dd>
                <MoneyRow label="Net price" value={figures.netPrice} />
              </dl>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a line to see how its price is built up.
            </p>
          )}
        </div>
      </CollapsibleSection>

      {UNBUILT_LINE_PANELS.map((panel) => (
        <CollapsibleSection
          key={panel.title}
          title={panel.title}
          summary={lineLabel}
        >
          <div className="p-3">
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {panel.columns.map((column) => (
                      <TableHead key={column} className="whitespace-nowrap">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell
                      colSpan={panel.columns.length}
                      className="text-muted-foreground"
                    >
                      Not built yet for quotes.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CollapsibleSection>
      ))}
    </>
  );
};
