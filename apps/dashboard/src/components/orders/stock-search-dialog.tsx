"use client";

import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { searchSellableStock } from "@/app/(dashboard)/orders/actions";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormLabel } from "@/components/ui/form-field";
import { cn, formatNumber } from "@/lib/helpers";
import type {
  StockSearchLot,
  StockSearchSource,
  StockSearchVariant,
} from "@/lib/server/stock-search";

/**
 * What the dialog hands back when somebody commits.
 *
 * Two shapes, because the reference offers two buttons. `Use selected stock`
 * binds the line to the lot somebody picked; `Use selected product` takes the
 * article and lets this resolve which lot that means. Both carry a lot, so a
 * caller never has to decide.
 */
export type StockSearchChoice =
  | { kind: "lot"; lot: StockSearchLot }
  | {
      kind: "variant";
      variant: StockSearchVariant;
      /**
       * The lot the article resolves to — the one with the most available of
       * it. The reference can leave a line unallocated; ours cannot, because
       * the line writes a reservation and a reservation binds a lot. So taking
       * the article means taking its fullest lot, and the caller is told which
       * rather than left to guess.
       */
      lot: StockSearchLot | null;
    };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (choice: StockSearchChoice) => void;
  /** Seeds the product filter, so the dialog opens where the line already is. */
  initialProductCode?: string | null;
  /**
   * Which sources this document may search, in the order the buttons appear.
   *
   * 🔴 A **selling** document searches the shelf; a **buying** one searches the
   * catalogue, because the whole reason to raise a purchase order is that the
   * metal is not there. Defaults to the selling pair.
   */
  sources?: StockSearchSource[];
  /**
   * Suppresses the lot grid and `Use selected stock`.
   *
   * A purchase line names an article, not a parcel — there is no lot to bind
   * to, and offering one would invite somebody to buy metal they already own.
   */
  productOnly?: boolean;
};

type Filters = {
  productCode: string;
  searchCode: string;
  quality: string;
  lengthMm: string;
  widthMm: string;
  thicknessMm: string;
  marginPercent: string;
  onlyWithPhysicalStock: boolean;
  includeFirstChoice: boolean;
  includeSecondChoice: boolean;
  source: StockSearchSource;
};

const EMPTY_FILTERS: Filters = {
  productCode: "",
  searchCode: "",
  quality: "",
  lengthMm: "",
  widthMm: "",
  thicknessMm: "",
  // The reference's own default, printed beside each dimension.
  marginPercent: "5",
  onlyWithPhysicalStock: true,
  // Both unticked, the way the reference opens: both choices are offered
  // together until somebody narrows it.
  includeFirstChoice: false,
  includeSecondChoice: false,
  source: "stock",
};

const SOURCE_LABELS: Record<StockSearchSource, string> = {
  stock: "Stock",
  purchase: "Purchase",
  catalogue: "Catalogue",
};

const num = (value: string): number | null => {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const dimensions = (row: { lengthMm: number | null; widthMm: number | null }) =>
  [row.lengthMm, row.widthMm].filter(Boolean).join(" × ") || "—";

/**
 * The `Stock` window a sales line is entered through.
 *
 * Watched on 21-9-2026. It is not a product dropdown: it searches the shelf on
 * product, quality and the three dimensions — each with a ±5 % margin, because
 * a customer asking for a 3000 mm plate will take a 2950 one — and shows the
 * matches twice. The upper grid groups them into product/quality variants; the
 * lower lists the individual lots behind them, with the charge each carries.
 *
 * 🔴 The `Purchase` source is how goods are sold before they arrive. Purchase
 * order 401141 carried 90 of its 100 pieces already spoken for while the metal
 * was still at the mill, and the receipt then handed the warehouseman exactly
 * that allocation to confirm.
 */
export const StockSearchDialog = ({
  open,
  onOpenChange,
  onChoose,
  initialProductCode,
  sources,
  productOnly = false,
}: Props) => {
  const allowedSources: StockSearchSource[] = sources ?? ["stock", "purchase"];
  const firstSource = allowedSources[0] ?? "stock";

  // How this document opens the search. The effect below reseeds from here when
  // the dialog opens — seeding from EMPTY_FILTERS instead put every caller back
  // on the shelf, so a purchase order searched stock it does not have and the
  // article's own dimensions never reached the grid.
  const openingFilters = (): Filters => ({
    ...EMPTY_FILTERS,
    source: firstSource,
    // A catalogue search is about articles, not what happens to be on the
    // shelf, so the physical-stock filter would hide almost everything.
    onlyWithPhysicalStock: firstSource !== "catalogue",
    productCode: initialProductCode ?? "",
  });

  const [filters, setFilters] = useState<Filters>(openingFilters);
  const [variants, setVariants] = useState<StockSearchVariant[]>([]);
  const [lots, setLots] = useState<StockSearchLot[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = (next: Filters) => {
    startTransition(async () => {
      const found = await searchSellableStock({
        productCode: next.productCode || null,
        searchCode: next.searchCode || null,
        quality: next.quality || null,
        lengthMm: num(next.lengthMm),
        widthMm: num(next.widthMm),
        thicknessMm: num(next.thicknessMm),
        marginPercent: Number(next.marginPercent) || 0,
        onlyWithPhysicalStock: next.onlyWithPhysicalStock,
        includeFirstChoice: next.includeFirstChoice,
        includeSecondChoice: next.includeSecondChoice,
        source: next.source,
      });
      setVariants(found.variants);
      setLots(found.lots);
      setTruncated(found.truncated);
      setSelectedVariant(null);
      setSelectedLot(null);
      setHasSearched(true);
    });
  };

  // Open where the line already is rather than on an empty search: a line being
  // corrected almost always wants more of the same article.
  useEffect(() => {
    if (!open) {
      return;
    }
    const seeded: Filters = {
      ...EMPTY_FILTERS,
      source: firstSource,
      onlyWithPhysicalStock: firstSource !== "catalogue",
      productCode: initialProductCode ?? "",
    };
    setFilters(seeded);
    runSearch(seeded);
  }, [open, initialProductCode, firstSource]);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const chooseSource = (source: StockSearchSource) => {
    const next = {
      ...filters,
      source,
      // The catalogue is the article list. Filtering it by what happens to be
      // on the shelf would hide exactly the articles somebody is here to buy.
      onlyWithPhysicalStock:
        source === "catalogue" ? false : filters.onlyWithPhysicalStock,
    };
    setFilters(next);
    runSearch(next);
  };

  const variantKey = (variant: StockSearchVariant) =>
    [
      variant.productUuid,
      variant.quality ?? "",
      variant.stockCategory ?? "",
      variant.options ?? "",
    ].join("|");

  const chosenVariant = variants.find((v) => variantKey(v) === selectedVariant);
  const chosenLot = lots.find((lot) => lot.uuid === selectedLot);
  const isIncoming = filters.source === "purchase";
  // 🔴 On a catalogue search nothing is on the shelf, so Technical, Reserved,
  // Available and Lots are four columns of zeros. What a buyer needs instead is
  // the weight of one piece: it is what a price per tonne is charged on, and it
  // is the only thing distinguishing the six `PK304L20021` rows in this
  // catalogue — two of which can be weighed and four of which bill € 0,00.
  const isCatalogue = filters.source === "catalogue";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            {filters.source === "catalogue"
              ? "Products"
              : filters.source === "purchase"
                ? "Incoming purchases"
                : "Stock"}
          </DialogTitle>
          <DialogDescription>
            {filters.source === "catalogue"
              ? "Search the article list, whether or not any of it is on the shelf. Dimensions match within the margin, so a plate a little off the size asked for still shows up."
              : filters.source === "purchase"
                ? "Search goods that have been ordered and have not arrived. Dimensions match within the margin."
                : "Search the shelf, then take either the article or one particular lot. Dimensions match within the margin, so a plate a little off the size asked for still shows up."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <FormLabel htmlFor="stock-product">Product code</FormLabel>
              <Input
                id="stock-product"
                value={filters.productCode}
                onChange={(event) => set("productCode", event.target.value)}
              />
            </div>
            <div>
              <FormLabel htmlFor="stock-search-code">Search code</FormLabel>
              <Input
                id="stock-search-code"
                value={filters.searchCode}
                onChange={(event) => set("searchCode", event.target.value)}
              />
            </div>
            <div>
              <FormLabel htmlFor="stock-quality">Quality</FormLabel>
              <Input
                id="stock-quality"
                value={filters.quality}
                onChange={(event) => set("quality", event.target.value)}
              />
            </div>
            <div>
              <FormLabel htmlFor="stock-margin">Margin %</FormLabel>
              <Input
                id="stock-margin"
                inputMode="decimal"
                value={filters.marginPercent}
                onChange={(event) => set("marginPercent", event.target.value)}
              />
            </div>
            <div>
              <FormLabel htmlFor="stock-length">Length (mm)</FormLabel>
              <Input
                id="stock-length"
                inputMode="decimal"
                value={filters.lengthMm}
                onChange={(event) => set("lengthMm", event.target.value)}
              />
            </div>
            <div>
              <FormLabel htmlFor="stock-width">Width (mm)</FormLabel>
              <Input
                id="stock-width"
                inputMode="decimal"
                value={filters.widthMm}
                onChange={(event) => set("widthMm", event.target.value)}
              />
            </div>
            <div>
              <FormLabel htmlFor="stock-thickness">Thickness (mm)</FormLabel>
              <Input
                id="stock-thickness"
                inputMode="decimal"
                value={filters.thicknessMm}
                onChange={(event) => set("thicknessMm", event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={() => runSearch(filters)}
                disabled={isPending}
              >
                <Search className="size-4" />
                {isPending ? "Searching…" : "Search"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {/*
              🔴 The reference's label says "available" and its filter says
              `TotalPhysicalStock ≠ 0`. Ours says what it does: metal that is
              spoken for is still metal a salesman has to be able to see, because
              reservations move.
            */}
            {/* Meaningless against the article list, where nothing is on a
                shelf by definition. */}
            {filters.source !== "catalogue" && (
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={filters.onlyWithPhysicalStock}
                  onChange={(event) => {
                    const next = {
                      ...filters,
                      onlyWithPhysicalStock: event.target.checked,
                    };
                    setFilters(next);
                    runSearch(next);
                  }}
                />
                Only articles physically in stock
              </label>
            )}
            <label className="flex items-center gap-2">
              <Checkbox
                checked={filters.includeFirstChoice}
                onChange={(event) => {
                  const next = {
                    ...filters,
                    includeFirstChoice: event.target.checked,
                  };
                  setFilters(next);
                  runSearch(next);
                }}
              />
              1st choice
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={filters.includeSecondChoice}
                onChange={(event) => {
                  const next = {
                    ...filters,
                    includeSecondChoice: event.target.checked,
                  };
                  setFilters(next);
                  runSearch(next);
                }}
              />
              2nd choice
            </label>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Articles
            </p>
            <div className="max-h-48 overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead className="text-right">Kg/piece</TableHead>
                    {!isCatalogue && (
                      <>
                        <TableHead className="text-right">Technical</TableHead>
                        <TableHead className="text-right">Reserved</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                        <TableHead className="text-right">Lots</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant) => (
                    <TableRow
                      key={variantKey(variant)}
                      onClick={() => setSelectedVariant(variantKey(variant))}
                      className={cn(
                        "cursor-pointer",
                        selectedVariant === variantKey(variant) && "bg-muted",
                      )}
                    >
                      <TableCell>
                        {[variant.productCode, variant.productName]
                          .filter(Boolean)
                          .join(" — ")}
                      </TableCell>
                      <TableCell>{variant.quality ?? "—"}</TableCell>
                      <TableCell>
                        {[variant.options, variant.stockCategory]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </TableCell>
                      <TableCell>{dimensions(variant)}</TableCell>
                      {/* An article with no weight cannot be bought by the
                          tonne, and saying so here is earlier than finding out
                          on the line. */}
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          !variant.pieceWeightKg && "text-destructive",
                        )}
                      >
                        {variant.pieceWeightKg
                          ? formatNumber(variant.pieceWeightKg)
                          : "no weight"}
                      </TableCell>
                      {!isCatalogue && (
                        <>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(variant.technical)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(variant.reserved)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(variant.available)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {variant.lotCount}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                  {variants.length === 0 && hasSearched && !isPending && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-muted-foreground">
                        Nothing matches. Widen the margin, or clear a dimension.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              {/* The reference's sources. `Internal production` is not offered:
                  we have never seen it hold anything, and a tab that is always
                  empty teaches people to stop looking at it.

                  Which of the rest appear is the document's decision — a buying
                  document has no use for the shelf. */}
              {allowedSources.map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={filters.source === option ? "default" : "outline"}
                  onClick={() => chooseSource(option)}
                  disabled={isPending}
                >
                  {SOURCE_LABELS[option]}
                </Button>
              ))}
              {isIncoming && (
                <p className="text-xs text-muted-foreground">
                  Goods still to arrive. Selling against these commits an
                  incoming purchase line rather than metal on the shelf.
                </p>
              )}
            </div>

            {/* A catalogue search has no parcels behind it — one empty row per
                article would say nothing and invite a pointless click. */}
            <div
              className={cn(
                "max-h-56 overflow-y-auto rounded-lg border",
                productOnly && "hidden",
              )}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isIncoming ? "Expected" : "Location"}</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Charge</TableHead>
                    <TableHead>Internal batch</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Kg</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((lot) => (
                    <TableRow
                      key={lot.uuid}
                      onClick={() => setSelectedLot(lot.uuid)}
                      className={cn(
                        "cursor-pointer",
                        selectedLot === lot.uuid && "bg-muted",
                        lot.available <= 0 && "text-destructive",
                      )}
                    >
                      <TableCell>
                        {isIncoming
                          ? `${lot.expectedDate ?? "—"} · IO${lot.purchaseOrderId ?? ""}`
                          : (lot.locationName ?? "—")}
                      </TableCell>
                      <TableCell>{lot.productCode ?? "—"}</TableCell>
                      <TableCell>{lot.charge ?? "—"}</TableCell>
                      <TableCell>{lot.internalBatch ?? "—"}</TableCell>
                      <TableCell>{dimensions(lot)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(lot.available)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(lot.quantityKg)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lot.remark ?? ""}
                      </TableCell>
                    </TableRow>
                  ))}
                  {lots.length === 0 && hasSearched && !isPending && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-muted-foreground">
                        No lots.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {truncated && (
              <p className="mt-2 text-xs text-muted-foreground">
                Showing the first 200 matches. Narrow the search to see the rest.
              </p>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!chosenVariant}
            onClick={() => {
              if (!chosenVariant) {
                return;
              }
              const best = lots
                .filter(
                  (lot) =>
                    lot.productUuid === chosenVariant.productUuid &&
                    (lot.quality ?? "") === (chosenVariant.quality ?? "") &&
                    (lot.options ?? "") === (chosenVariant.options ?? "") &&
                    (lot.stockCategory ?? "") ===
                      (chosenVariant.stockCategory ?? "") &&
                    lot.available > 0,
                )
                .sort((a, b) => b.available - a.available)[0];
              onChoose({
                kind: "variant",
                variant: chosenVariant,
                lot: best ?? null,
              });
            }}
          >
            Use selected product
          </Button>
          {/* A purchase line names an article, not a parcel. */}
          {!productOnly && (
            <Button
              type="button"
              disabled={!chosenLot || chosenLot.available <= 0}
              onClick={() => {
                if (chosenLot) {
                  onChoose({ kind: "lot", lot: chosenLot });
                }
              }}
            >
              Use selected stock
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
