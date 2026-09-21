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
};

type Filters = {
  productCode: string;
  searchCode: string;
  quality: string;
  lengthMm: string;
  widthMm: string;
  thicknessMm: string;
  marginPercent: string;
  onlyWithAvailableStock: boolean;
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
  onlyWithAvailableStock: true,
  source: "stock",
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
}: Props) => {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
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
        onlyWithAvailableStock: next.onlyWithAvailableStock,
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
    const seeded = { ...EMPTY_FILTERS, productCode: initialProductCode ?? "" };
    setFilters(seeded);
    runSearch(seeded);
  }, [open, initialProductCode]);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const chooseSource = (source: StockSearchSource) => {
    const next = { ...filters, source };
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Stock</DialogTitle>
          <DialogDescription>
            Search the shelf, then take either the article or one particular lot.
            Dimensions match within the margin, so a plate a little off the size
            asked for still shows up.
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

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={filters.onlyWithAvailableStock}
              onChange={(event) => {
                const next = {
                  ...filters,
                  onlyWithAvailableStock: event.target.checked,
                };
                setFilters(next);
                runSearch(next);
              }}
            />
            Only articles with stock available
          </label>

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
                    <TableHead className="text-right">Technical</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Lots</TableHead>
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
                    </TableRow>
                  ))}
                  {variants.length === 0 && hasSearched && !isPending && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-muted-foreground">
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
              {/* The reference's three sources. `Internal production` is not
                  offered: we have never seen it hold anything, and a tab that
                  is always empty teaches people to stop looking at it. */}
              <Button
                type="button"
                size="sm"
                variant={filters.source === "stock" ? "default" : "outline"}
                onClick={() => chooseSource("stock")}
                disabled={isPending}
              >
                Stock
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filters.source === "purchase" ? "default" : "outline"}
                onClick={() => chooseSource("purchase")}
                disabled={isPending}
              >
                Purchase
              </Button>
              {isIncoming && (
                <p className="text-xs text-muted-foreground">
                  Goods still to arrive. Selling against these commits an
                  incoming purchase line rather than metal on the shelf.
                </p>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto rounded-lg border">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
