import { LotLedger, LotWeights } from "@/lib/helpers";

type LotLedgerProps = {
  ledger: LotLedger;
  /** `Pieces`, `Kg` — whatever the lot is counted in. */
  unit: string;
  /**
   * What the bold total at the bottom is called. The reference reuses the same
   * panel and relabels it: `Totaal verplaatsbaar` on a relocation,
   * `Totaal splitsbaar` on a split.
   */
  totalLabel: string;
};

type LotWeightsProps = {
  weights: LotWeights;
};

type LotWorkSummaryProps = {
  /** `Nieuw` · `Vrijgegeven` · `Klaar` — open warehouse work, by status. */
  workOrderQuantities: { new: number; released: number; ready: number };
  ledger: LotLedger;
  unit: string;
};

type SummaryLineProps = {
  label: string;
  value: number;
};

type LedgerLineProps = {
  label: string;
  value: number;
  /** Indented sub-lines, the way the reference nests its two deductions. */
  indented?: boolean;
  strong?: boolean;
};

const formatQuantity = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(3);

const LedgerLine = ({ label, value, indented, strong }: LedgerLineProps) => (
  <div
    className={`flex items-baseline justify-between gap-4 ${
      indented ? "pl-4" : ""
    } ${strong ? "border-t pt-1.5 mt-1.5 font-semibold" : ""}`}
  >
    <span
      className={
        indented ? "text-xs text-muted-foreground" : "text-sm text-foreground"
      }
    >
      {label}
    </span>
    <span
      className={`tabular-nums ${
        indented ? "text-xs text-muted-foreground" : "text-sm"
      }`}
    >
      {formatQuantity(value)}
    </span>
  </div>
);

const SummaryLine = ({ label, value }: SummaryLineProps) => (
  <div className="flex items-baseline justify-between gap-4">
    <span className="text-sm text-foreground">{label}</span>
    <span className="text-sm tabular-nums">{formatQuantity(value)}</span>
  </div>
);

/**
 * The summary `Corrigeren voorraad` (233) and `Aanmaken overboekingsopdracht`
 * (240) open with — not the relocation ledger below.
 *
 * Same title, `Hoeveelheid in magazijnopdrachten en reserveringen`, but two
 * columns of three:
 *
 *   Nieuw:          0        Niet gereserveerd:   0
 *   Vrijgegeven:    0        Gereserveerd:       25
 *   Klaar:          0        Beschikbaar:         0
 *
 * The left is what stands on this lot's warehouse work orders, per status; the
 * right is how the lot splits between free and claimed. Neither dialog moves
 * metal by the relocation rules, so neither carries `Totaal verplaatsbaar`.
 */
export const StockLotWorkSummary = ({
  workOrderQuantities,
  ledger,
  unit,
}: LotWorkSummaryProps) => (
  <div className="rounded-lg border bg-muted/30 p-3">
    <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      Quantity in warehouse orders and reservations ({unit})
    </p>
    <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
      <div className="space-y-1">
        <SummaryLine label="New" value={workOrderQuantities.new} />
        <SummaryLine label="Released" value={workOrderQuantities.released} />
        <SummaryLine label="Ready" value={workOrderQuantities.ready} />
      </div>
      <div className="space-y-1">
        <SummaryLine label="Not reserved" value={ledger.available} />
        <SummaryLine label="Reserved" value={ledger.reserved} />
        <SummaryLine label="Available" value={ledger.availableAndMovable} />
      </div>
    </div>
  </div>
);

/**
 * The read-only ledger every lot dialog opens with.
 *
 * 🔴 **We rendered none of this, and it is the most important thing on the
 * dialog.** Somebody pressing `Correct` on our build could not see that 25 of
 * 25 pieces were reserved — the single fact that decides whether the action is
 * safe. The reference states it before you type anything:
 *
 *   Technische voorraad:                 25
 *   Beschikbaar:                          0
 *     Geplande verplaatsingen:            0
 *     Beschikbaar en verplaatsbaar:       0
 *   Gereserveerd:                        25
 *     Met onderhanden opdrachten:         0
 *     Geplande verplaatsingen:            0
 *     Gereserveerd en verplaatsbaar:     25
 *   Totaal verplaatsbaar:                25
 *
 * 🔑 `Technical = Reserved + Available`, always.
 *
 * 🔑 **Reserved stock is movable and splittable** — the captured lot was
 * reserved in full and still read `Gereserveerd en verplaatsbaar: 25`, because
 * a reservation binds the lot and not the shelf. Only metal on an open work
 * order or already scheduled to move subtracts.
 */
export const StockLotLedger = ({
  ledger,
  unit,
  totalLabel,
}: LotLedgerProps) => (
  <div className="rounded-lg border bg-muted/30 p-3">
    <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      What this action may touch ({unit})
    </p>
    <LedgerLine label="Technical stock" value={ledger.technical} />
    <LedgerLine label="Available" value={ledger.available} />
    <LedgerLine
      label="Planned relocations"
      value={ledger.availablePlannedMoves}
      indented
    />
    <LedgerLine
      label="Available and movable"
      value={ledger.availableAndMovable}
      indented
    />
    <LedgerLine label="Reserved" value={ledger.reserved} />
    <LedgerLine
      label="On open work orders"
      value={ledger.reservedOnOpenWorkOrders}
      indented
    />
    <LedgerLine
      label="Planned relocations"
      value={ledger.reservedPlannedMoves}
      indented
    />
    <LedgerLine
      label="Reserved and movable"
      value={ledger.reservedAndMovable}
      indented
    />
    <LedgerLine label={totalLabel} value={ledger.totalMovable} strong />
    {ledger.reserved > 0 && ledger.reservedAndMovable > 0 ? (
      <p className="mt-2 text-xs text-muted-foreground">
        Reserved metal counts as movable — a reservation binds the lot, not the
        shelf.
      </p>
    ) : null}
  </div>
);

/**
 * The four weights, side by side with the two differences between them.
 *
 * On the captured lot: theoretical 1 766,25 · weighed 1 754 · gross 1 798 ·
 * net 1 754, so the tare is 44 kg and the drift against theoretical is
 * −12,25 kg. The drift is not an error — only the weighed weight is accepted as
 * the basis for invoicing, so it is what the supplier bills on.
 */
export const StockLotWeights = ({ weights }: LotWeightsProps) => (
  <div className="rounded-lg border p-3">
    <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      Weights (kg)
    </p>
    <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
      <div>
        <p className="text-xs text-muted-foreground">Theoretical</p>
        <p className="text-sm tabular-nums">
          {weights.theoreticalKg ?? "—"}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Weighed</p>
        <p className="text-sm tabular-nums">{weights.weighedKg ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Gross</p>
        <p className="text-sm tabular-nums">{weights.grossKg ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Net</p>
        <p className="text-sm tabular-nums">{weights.netKg ?? "—"}</p>
      </div>
    </div>
    {weights.tareKg !== null || weights.driftKg !== null ? (
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 border-t pt-2 text-xs text-muted-foreground">
        {weights.tareKg !== null ? (
          <span>
            Tare (gross − net):{" "}
            <span className="tabular-nums text-foreground">
              {weights.tareKg}
            </span>
          </span>
        ) : null}
        {weights.driftKg !== null ? (
          <span>
            Drift against theoretical:{" "}
            <span className="tabular-nums text-foreground">
              {weights.driftKg > 0 ? `+${weights.driftKg}` : weights.driftKg}
            </span>{" "}
            — this is what the invoice is billed on
          </span>
        ) : null}
        {weights.netMatchesWeighed === false ? (
          <span className="text-amber-600">
            Net and weighed disagree — one of the two was keyed wrong
          </span>
        ) : null}
      </div>
    ) : null}
  </div>
);
