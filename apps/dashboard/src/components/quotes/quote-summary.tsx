import {
  formatMoney,
  formatNumber,
  formatPercent,
  QuoteSummary,
  QuoteSummaryBlock,
} from "@/lib/helpers";

type Props = {
  summary: QuoteSummary;
  /** Shown under the heading when the figures are a pre-save estimate. */
  note?: string;
};

type RowProps = {
  label: string;
  block: QuoteSummaryBlock;
  emphasis?: boolean;
};

type CostRowProps = {
  label: string;
  amount: number;
};

type ProfitCellProps = {
  amount: number;
  percent: number;
};

// Money plus the margin it represents, e.g. "€ 1,250.00 (12.5%)" — the pairing
// the reference system prints in both profit columns.
const ProfitCell = ({ amount, percent }: ProfitCellProps) => (
  <span className="tabular-nums">
    {formatMoney(amount)}{" "}
    <span className="text-muted-foreground">({formatPercent(percent)})</span>
  </span>
);

const SummaryRow = ({ label, block, emphasis = false }: RowProps) => (
  <>
    <dt
      className={
        emphasis ? "py-1 text-sm font-medium" : "py-1 text-sm text-foreground"
      }
    >
      {label}
    </dt>
    <dd className="py-1 text-right text-sm tabular-nums">
      {formatMoney(block.revenue)}
    </dd>
    <dd className="py-1 text-right text-sm">
      <ProfitCell amount={block.profit} percent={block.profitPercent} />
    </dd>
    <dd className="py-1 text-right text-sm">
      <ProfitCell
        amount={block.profitReplPrice}
        percent={block.profitReplPricePercent}
      />
    </dd>
  </>
);

// Transport and handling have no revenue of their own — they only pull profit
// down — so the revenue column stays deliberately blank.
const CostRow = ({ label, amount }: CostRowProps) => (
  <>
    <dt className="py-1 text-sm text-foreground">{label}</dt>
    <dd className="py-1" />
    <dd className="py-1 text-right text-sm tabular-nums">
      {formatMoney(amount)}
    </dd>
    <dd className="py-1 text-right text-sm tabular-nums">
      {formatMoney(amount)}
    </dd>
  </>
);

export const QuoteSummaryPanel = ({ summary, note }: Props) => (
  <section className="space-y-3">
    <div className="flex items-baseline justify-between border-b pb-2">
      <h2 className="text-base font-semibold">Summary</h2>
      <span className="text-xs text-muted-foreground">
        Calculated from the lines — not editable
      </span>
    </div>

    {note && <p className="text-xs text-muted-foreground">{note}</p>}

    <div className="overflow-x-auto">
      <dl className="grid min-w-xl grid-cols-[minmax(9rem,1fr)_repeat(3,minmax(7rem,auto))] items-baseline gap-x-6">
        <dt />
        <dd className="pb-1 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Revenue
        </dd>
        <dd className="pb-1 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Profit
        </dd>
        <dd className="pb-1 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Profit w.r.t. Repl. price
        </dd>

        <SummaryRow label="Materials" block={summary.materials} />
        <SummaryRow label="Options" block={summary.options} />
        <SummaryRow label="Surcharges" block={summary.surcharges} />
        <CostRow label="Transport costs" amount={summary.transportCosts} />
        <CostRow label="Handling costs" amount={summary.handlingCosts} />

        <div className="col-span-4 my-1 border-t border-border" />

        <SummaryRow label="Tot. excl. VAT" block={summary.total} emphasis />

        <dt className="py-1 text-sm">VAT</dt>
        <dd className="py-1 text-right text-sm tabular-nums">
          {formatMoney(summary.vatAmount)}
        </dd>
        <dd className="py-1" />
        <dd className="py-1" />

        <dt className="py-1 text-sm font-medium">Tot. incl. VAT</dt>
        <dd className="py-1 text-right text-sm font-medium tabular-nums">
          {formatMoney(summary.totalInclVat)}
        </dd>
        <dd className="py-1 text-right text-sm text-muted-foreground">
          Avg. kilo price
        </dd>
        <dd className="py-1 text-right text-sm tabular-nums">
          {formatMoney(summary.avgKiloPrice)}
        </dd>

        <dt className="py-1 text-sm">Total weight</dt>
        <dd className="py-1 text-right text-sm tabular-nums">
          {formatNumber(summary.totalWeightKg)} Kg
        </dd>
        <dd className="py-1 text-right text-sm text-muted-foreground">
          Theor. wt.
        </dd>
        <dd className="py-1 text-right text-sm tabular-nums">
          {formatNumber(summary.theoreticalWeightKg)} Kg
        </dd>
      </dl>
    </div>
  </section>
);
