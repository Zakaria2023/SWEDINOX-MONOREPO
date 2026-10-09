"use client";

import { useEffect, useState, useTransition } from "react";
import { ListChecks, RotateCcw, Search } from "lucide-react";
import { searchStockWindow } from "@/app/(dashboard)/orders/actions";
import {
  getProductGroupsForSelect,
  ProductGroupOption,
} from "@/app/(dashboard)/product-groups/actions";
import {
  getStockLotDialog,
  StockLotDialogData,
} from "@/app/(dashboard)/stock/actions";
import { StockReservationsDialog } from "@/components/stock/stock-reservations-dialog";
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
import { Select, SelectOption } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { BooleanFlag } from "@/components/ui/boolean-flag";
import { FormLabel } from "@/components/ui/form-field";
import { featuresQualities, stockOptions } from "@/lib/enums";
import {
  cn,
  enumOptions,
  formatDateColumn,
  formatMoney,
  formatNumber,
  orDash,
} from "@/lib/helpers";
import { STOCK_OPTION_LABELS } from "@/lib/labels";
import type {
  StockSearchLot,
  StockSearchSource,
  StockSearchVariant,
  StockWindowTab,
} from "@/lib/server/stock-search";

/**
 * What the dialog hands back when somebody commits.
 *
 * Two shapes, because the reference offers two buttons. `Use selected stock`
 * binds the line to the lot somebody picked; `Use selected article` takes the
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
   * Kept for the callers that say which supply their document buys or sells
   * from. The window is the same for every document — the reference draws one
   * `Voorraad` window for a sales line and a purchase line alike, and opens it
   * on the shelf either way — so this no longer changes what is shown.
   */
  sources?: StockSearchSource[];
  /**
   * Suppresses `Use selected stock`.
   *
   * A purchase line names an article, not a parcel — there is no lot to bind
   * to, and offering one would invite somebody to buy metal they already own.
   */
  productOnly?: boolean;
};

type Filters = {
  productCode: string;
  searchCode: string;
  productGroupUuid: string;
  quality: string;
  option: string;
  lengthFrom: string;
  lengthTo: string;
  widthFrom: string;
  widthTo: string;
  thicknessFrom: string;
  thicknessTo: string;
  useMargin: boolean;
  lengthMargin: string;
  widthMargin: string;
  thicknessMargin: string;
  onlyWithTechnicalStock: boolean;
  includeFirstChoice: boolean;
  includeSecondChoice: boolean;
  tab: StockWindowTab;
};

type DimensionKey = "length" | "width" | "thickness";

const EMPTY_FILTERS: Filters = {
  productCode: "",
  searchCode: "",
  productGroupUuid: "",
  quality: "",
  option: "",
  lengthFrom: "",
  lengthTo: "",
  widthFrom: "",
  widthTo: "",
  thicknessFrom: "",
  thicknessTo: "",
  // `Met marges zoeken` ticked, 5 % beside each dimension — the reference's
  // own defaults.
  useMargin: true,
  lengthMargin: "5",
  widthMargin: "5",
  thicknessMargin: "5",
  // All three unticked, the way the reference opens: the article list, both
  // choices together, until somebody narrows it.
  onlyWithTechnicalStock: false,
  includeFirstChoice: false,
  includeSecondChoice: false,
  tab: "stock",
};

const TAB_LABELS: Record<StockWindowTab, string> = {
  stock: "Stock",
  purchase: "Purchase",
  internal_production: "Internal production",
};

const TABS: StockWindowTab[] = ["stock", "purchase", "internal_production"];

const DIMENSIONS: Array<{ key: DimensionKey; label: string }> = [
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
];

const qualityOptions: SelectOption[] = [
  { value: "", label: "Empty" },
  ...featuresQualities.map((quality) => ({ value: quality, label: quality })),
];

const optionOptions = enumOptions(stockOptions, STOCK_OPTION_LABELS);

// `300 ST`, `9.420`: a quantity with the unit it is counted in.
const qty = (value: number, unit: string | null) =>
  unit ? `${formatNumber(value)} ${unit.toUpperCase()}` : formatNumber(value);

// `2`, not `2.00`: a thickness printed as the reference prints it.
const mm = (value: string | number | null) =>
  value === null ? "—" : formatNumber(Number(value));

const num = (value: string): number | null => {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const variantKey = (variant: StockSearchVariant) =>
  [
    variant.productUuid,
    variant.quality ?? "",
    variant.stockCategory ?? "",
    variant.options ?? "",
  ].join("|");

/**
 * The `Stock` window a document line is entered through — the reference's
 * `Voorraad`, captured 21-9-2026 from a sales order and 9-10-2026 from a
 * purchase order, and it is one window.
 *
 * It is not a product dropdown. Filters on article code, search code, product
 * group, quality and processing, and the three dimensions each `From` / `To`
 * with a ±5 % `Search with margin`, because a customer asking for a 3000 mm
 * plate will take a 2950 one. Then two grids: the article list above, grouped
 * by quality where the shelf holds an article in several, and below it three
 * tabs — `Stock`, `Purchase`, `Internal production` — listing the lots behind
 * them, with the charge each carries.
 *
 * 🔴 It opens **empty** and waits for `Search`: the reference lists nothing
 * until asked, and so does this — except when a line being corrected brings
 * its article along, where opening on that article is what the person wants.
 *
 * 🔴 The `Purchase` tab is how goods are sold before they arrive. Purchase
 * order 401141 carried 90 of its 100 pieces already spoken for while the metal
 * was still at the mill, and the receipt then handed the warehouseman exactly
 * that allocation to confirm.
 */
export const StockSearchDialog = ({
  open,
  onOpenChange,
  onChoose,
  initialProductCode,
  productOnly = false,
}: Props) => {
  // The lot grid opens on the shelf whatever the document: the reference's
  // purchase order opened on `Voorraad` too (9-10-2026).
  const openingTab: StockWindowTab = "stock";

  const openingFilters = (): Filters => ({
    ...EMPTY_FILTERS,
    tab: openingTab,
    productCode: initialProductCode ?? "",
  });

  const [filters, setFilters] = useState<Filters>(openingFilters);
  const [productGroups, setProductGroups] = useState<
    ProductGroupOption[] | null
  >(null);
  const [articles, setArticles] = useState<StockSearchVariant[]>([]);
  const [lots, setLots] = useState<StockSearchLot[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);
  const [reservations, setReservations] = useState<StockLotDialogData | null>(
    null,
  );

  const runSearch = (next: Filters) => {
    const margin = (value: string) =>
      next.useMargin ? Number(value.replace(",", ".")) || 0 : 0;
    startTransition(async () => {
      const found = await searchStockWindow({
        productCode: next.productCode || null,
        searchCode: next.searchCode || null,
        productGroupUuid: next.productGroupUuid || null,
        quality: next.quality || null,
        option: next.option ? STOCK_OPTION_LABELS[next.option as never] : null,
        lengthMm: num(next.lengthFrom),
        lengthMmTo: num(next.lengthTo),
        widthMm: num(next.widthFrom),
        widthMmTo: num(next.widthTo),
        thicknessMm: num(next.thicknessFrom),
        thicknessMmTo: num(next.thicknessTo),
        lengthMarginPercent: margin(next.lengthMargin),
        widthMarginPercent: margin(next.widthMargin),
        thicknessMarginPercent: margin(next.thicknessMargin),
        onlyWithTechnicalStock: next.onlyWithTechnicalStock,
        includeFirstChoice: next.includeFirstChoice,
        includeSecondChoice: next.includeSecondChoice,
        tab: next.tab,
      });
      setArticles(found.articles);
      setLots(found.lots);
      setTruncated(found.truncated);
      setSelectedArticle(
        found.articles[0] ? variantKey(found.articles[0]) : null,
      );
      setSelectedLot(null);
      setHasSearched(true);
    });
  };

  // Opens empty, as the reference does — unless a line being corrected brings
  // its article along, in which case it opens on that article.
  useEffect(() => {
    if (!open) {
      return;
    }
    const seeded: Filters = {
      ...EMPTY_FILTERS,
      tab: openingTab,
      productCode: initialProductCode ?? "",
    };
    setFilters(seeded);
    setArticles([]);
    setLots([]);
    setSelectedArticle(null);
    setSelectedLot(null);
    setHasSearched(false);
    if (initialProductCode) {
      runSearch(seeded);
    }
  }, [open, initialProductCode, openingTab]);

  // The `Product group` dropdown is read once, the first time the window opens.
  useEffect(() => {
    if (!open || productGroups !== null) {
      return;
    }
    getProductGroupsForSelect().then(setProductGroups);
  }, [open, productGroups]);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  // The reference has two resets, and they are not the same button. `Reset
  // dialog` clears what was typed and what was found; `Default settings` puts
  // the margins and the tickboxes back and keeps the rest.
  const resetDialog = () => {
    setFilters({ ...openingFilters(), productCode: "" });
    setArticles([]);
    setLots([]);
    setSelectedArticle(null);
    setSelectedLot(null);
    setHasSearched(false);
  };

  const restoreDefaults = () => {
    const next: Filters = {
      ...filters,
      useMargin: EMPTY_FILTERS.useMargin,
      lengthMargin: EMPTY_FILTERS.lengthMargin,
      widthMargin: EMPTY_FILTERS.widthMargin,
      thicknessMargin: EMPTY_FILTERS.thicknessMargin,
      onlyWithTechnicalStock: EMPTY_FILTERS.onlyWithTechnicalStock,
      includeFirstChoice: EMPTY_FILTERS.includeFirstChoice,
      includeSecondChoice: EMPTY_FILTERS.includeSecondChoice,
    };
    setFilters(next);
    if (hasSearched) {
      runSearch(next);
    }
  };

  const chooseTab = (tab: StockWindowTab) => {
    const next = { ...filters, tab };
    setFilters(next);
    if (hasSearched) {
      runSearch(next);
    }
  };

  // `Reserveringen…`: what is already holding the selected lot, before anybody
  // commits a line to it.
  const showReservations = (stockUuid: string) => {
    startTransition(async () => {
      setReservations(await getStockLotDialog(stockUuid));
    });
  };

  const chosenArticle = articles.find(
    (article) => variantKey(article) === selectedArticle,
  );
  // The lower grid is the lots behind the article picked above; with nothing
  // picked it is everything the search found.
  const shownLots = chosenArticle
    ? lots.filter((lot) => lot.productUuid === chosenArticle.productUuid)
    : lots;
  const chosenLot = lots.find((lot) => lot.uuid === selectedLot);
  const isIncoming = filters.tab === "purchase";

  const commitSelectedArticle = () => {
    if (!chosenArticle) {
      return;
    }
    const best = lots
      .filter(
        (lot) =>
          lot.productUuid === chosenArticle.productUuid &&
          (lot.quality ?? "") === (chosenArticle.quality ?? "") &&
          (lot.options ?? "") === (chosenArticle.options ?? "") &&
          (lot.stockCategory ?? "") === (chosenArticle.stockCategory ?? "") &&
          lot.available > 0,
      )
      .sort((a, b) => b.available - a.available)[0];
    onChoose({ kind: "variant", variant: chosenArticle, lot: best ?? null });
  };

  const productGroupOptions: SelectOption[] = [
    { value: "", label: "Empty" },
    ...(productGroups ?? []).map((group) => ({
      value: group.uuid,
      label: group.name ?? group.uuid,
    })),
  ];

  const dimensionValue = (key: DimensionKey, part: "From" | "To" | "Margin") =>
    filters[`${key}${part}` as keyof Filters] as string;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-6xl flex-col">
        <DialogHeader>
          <DialogTitle>Stock</DialogTitle>
          <DialogDescription>
            Fill in what you are looking for and press Search. Dimensions match
            within the margin, so a plate a little off the size asked for still
            shows up.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          <div className="grid gap-x-6 gap-y-3 lg:grid-cols-[1fr_auto_auto]">
            {/* Left: who and what. `Company` is greyed on the reference too —
                it is set by the document the window was opened from. */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FormLabel htmlFor="stock-product">Product code</FormLabel>
                <Input
                  id="stock-product"
                  value={filters.productCode}
                  autoFocus
                  onChange={(event) => set("productCode", event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      runSearch(filters);
                    }
                  }}
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
                <FormLabel htmlFor="stock-company">Company</FormLabel>
                <Input id="stock-company" value="" readOnly disabled />
              </div>
              <div>
                <FormLabel htmlFor="stock-product-group">
                  Product group
                </FormLabel>
                <Select
                  id="stock-product-group"
                  value={filters.productGroupUuid}
                  options={productGroupOptions}
                  onValueChange={(value) => set("productGroupUuid", value)}
                />
              </div>
              <div>
                <FormLabel htmlFor="stock-quality">Quality</FormLabel>
                <Select
                  id="stock-quality"
                  value={filters.quality}
                  options={qualityOptions}
                  onValueChange={(value) => set("quality", value)}
                />
              </div>
              <div>
                <FormLabel htmlFor="stock-option">Option</FormLabel>
                <Select
                  id="stock-option"
                  value={filters.option}
                  options={optionOptions}
                  onValueChange={(value) => set("option", value)}
                />
              </div>
            </div>

            {/* Middle: the three dimensions, `From` / `To` and a margin each. */}
            <div className="space-y-2">
              <div className="grid grid-cols-[5rem_6rem_6rem_5rem_1rem] items-center gap-2 text-sm">
                <span />
                <span className="text-xs text-muted-foreground">From</span>
                <span className="text-xs text-muted-foreground">
                  Until and incl.
                </span>
                <label className="col-span-2 flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={filters.useMargin}
                    onChange={(event) => set("useMargin", event.target.checked)}
                  />
                  Search with margin
                </label>
                {DIMENSIONS.map(({ key, label }) => (
                  <div key={key} className="contents">
                    <FormLabel htmlFor={`stock-${key}-from`}>{label}</FormLabel>
                    <Input
                      id={`stock-${key}-from`}
                      inputMode="decimal"
                      value={dimensionValue(key, "From")}
                      onChange={(event) =>
                        set(`${key}From`, event.target.value)
                      }
                    />
                    <Input
                      id={`stock-${key}-to`}
                      inputMode="decimal"
                      value={dimensionValue(key, "To")}
                      onChange={(event) => set(`${key}To`, event.target.value)}
                    />
                    <Input
                      id={`stock-${key}-margin`}
                      inputMode="decimal"
                      aria-label={`${label} margin %`}
                      value={dimensionValue(key, "Margin")}
                      disabled={!filters.useMargin}
                      onChange={(event) =>
                        set(`${key}Margin`, event.target.value)
                      }
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                onClick={() => runSearch(filters)}
                disabled={isPending}
              >
                <Search className="size-4" />
                {isPending ? "Searching…" : "Search"}
              </Button>
            </div>

            {/* Right: the three tickboxes. */}
            <div className="space-y-2 text-sm">
              {/* 🔴 The reference's label says "technical stock" and hides
                  articles that are not on the shelf at all — not articles that
                  are spoken for. Metal somebody else has reserved stays
                  visible, because reservations move. */}
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={filters.onlyWithTechnicalStock}
                  onChange={(event) =>
                    set("onlyWithTechnicalStock", event.target.checked)
                  }
                />
                Only articles with technical stock
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={filters.includeFirstChoice}
                    onChange={(event) =>
                      set("includeFirstChoice", event.target.checked)
                    }
                  />
                  1st choice
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={filters.includeSecondChoice}
                    onChange={(event) =>
                      set("includeSecondChoice", event.target.checked)
                    }
                  />
                  2nd choice
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="max-h-48 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Stk. cat.</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead className="text-right">Length</TableHead>
                    <TableHead className="text-right">Width</TableHead>
                    <TableHead className="text-right">Thickness</TableHead>
                    <TableHead className="text-right">Technical</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Kg (t.)</TableHead>
                    <TableHead className="text-right">Kg (r.)</TableHead>
                    <TableHead className="text-right">Kg (a.)</TableHead>
                    <TableHead className="text-right">Total len.</TableHead>
                    {/* `C. Kg` / `C. ST`: 0 on every row the reference showed
                        (8-10-2026, `PK316L150315`), and the header names
                        itself no further. Read as consignment stock, which is
                        not tracked here, so they print 0 as the reference
                        does. */}
                    <TableHead className="text-right">C. Kg</TableHead>
                    <TableHead className="text-right">C. ST</TableHead>
                    {/* Ours. A buying line is priced per tonne, and an
                        article with no weight bills € 0,00 — saying so here
                        is earlier than finding out on the line. */}
                    <TableHead className="text-right">Kg/piece</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article) => (
                    <TableRow
                      key={variantKey(article)}
                      onClick={() => setSelectedArticle(variantKey(article))}
                      onDoubleClick={() => {
                        setSelectedArticle(variantKey(article));
                        commitSelectedArticle();
                      }}
                      className={cn(
                        "cursor-pointer",
                        selectedArticle === variantKey(article) && "bg-muted",
                      )}
                    >
                      <TableCell>
                        {[article.productCode, article.productName]
                          .filter(Boolean)
                          .join(" — ")}
                      </TableCell>
                      <TableCell>{orDash(article.quality)}</TableCell>
                      <TableCell>{orDash(article.stockCategory)}</TableCell>
                      <TableCell>{orDash(article.options)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(article.lengthMm)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(article.widthMm)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {mm(article.thicknessMm)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {qty(article.technical, article.unit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {qty(article.reserved, article.unit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {qty(article.available, article.unit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(article.kgTechnical)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(article.kgReserved)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(article.kgAvailable)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(article.totalLengthM)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">0</TableCell>
                      <TableCell className="text-right tabular-nums">0</TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          !article.pieceWeightKg && "text-destructive",
                        )}
                      >
                        {article.pieceWeightKg
                          ? formatNumber(article.pieceWeightKg)
                          : "no weight"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {articles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={17} className="text-muted-foreground">
                        {isPending
                          ? "Searching…"
                          : hasSearched
                            ? "Nothing matches. Widen the margin, or clear a dimension."
                            : "Fill in a filter above and press Search."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {truncated
                  ? "Showing the first 200 matches. Narrow the search to see the rest."
                  : ""}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!chosenArticle}
                onClick={commitSelectedArticle}
              >
                Use selected article
              </Button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1 border-b">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => chooseTab(tab)}
                  disabled={isPending}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-1.5 text-sm transition-colors",
                    filters.tab === tab
                      ? "border-primary font-semibold text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
              {isIncoming && (
                <p className="ml-3 text-xs text-muted-foreground">
                  Goods still to arrive. Selling against these commits an
                  incoming purchase line rather than metal on the shelf.
                </p>
              )}
            </div>

            <div className="max-h-56 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* `Order hvh.` on the reference: what this document
                        has ordered of the lot, which on a new line is 0.
                        On the purchase tab the slot names the line instead. */}
                    <TableHead className="text-right">
                      {isIncoming ? "Expected" : "Order qty."}
                    </TableHead>
                    <TableHead className="text-right">Length</TableHead>
                    <TableHead className="text-right">Width</TableHead>
                    <TableHead className="text-right">Thick.</TableHead>
                    <TableHead className="text-right">Technical</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead>Unopened</TableHead>
                    <TableHead className="text-right">Kg (avail.)</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead className="text-right">APP</TableHead>
                    <TableHead className="text-right">Purchase price</TableHead>
                    <TableHead>Internal batch</TableHead>
                    <TableHead>Stk. cat.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shownLots.map((lot) => (
                    <TableRow
                      key={lot.uuid}
                      onClick={() => setSelectedLot(lot.uuid)}
                      className={cn(
                        "cursor-pointer",
                        selectedLot === lot.uuid && "bg-muted",
                        lot.available <= 0 && "text-destructive",
                      )}
                    >
                      <TableCell className="text-right tabular-nums">
                        {isIncoming
                          ? `${lot.expectedDate ?? "—"} · IO${lot.purchaseOrderId ?? ""}`
                          : "0"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(lot.lengthMm)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(lot.widthMm)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {mm(lot.thicknessMm)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {qty(lot.quantity, lot.unit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {qty(lot.reserved, lot.unit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {qty(lot.available, lot.unit)}
                      </TableCell>
                      <TableCell>
                        <BooleanFlag on={lot.unopened} label="Unopened" />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(
                          lot.quantity > 0
                            ? (lot.quantityKg * lot.available) / lot.quantity
                            : 0,
                        )}
                      </TableCell>
                      <TableCell>{orDash(lot.options)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {lot.remark ?? ""}
                      </TableCell>
                      <TableCell>{orDash(lot.quality)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {isIncoming
                          ? "—"
                          : `${formatMoney(lot.valuationPrice)} / TN`}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {lot.purchasePrice === null
                          ? "—"
                          : `${formatMoney(lot.purchasePrice)}${
                              lot.purchasePriceUnit
                                ? ` / ${lot.purchasePriceUnit.toUpperCase()}`
                                : ""
                            }`}
                      </TableCell>
                      <TableCell>{orDash(lot.internalBatch)}</TableCell>
                      <TableCell>{orDash(lot.stockCategory)}</TableCell>
                    </TableRow>
                  ))}
                  {shownLots.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={16} className="text-muted-foreground">
                        {filters.tab === "internal_production"
                          ? "Nothing in internal production."
                          : hasSearched && !isPending
                            ? "No lots."
                            : ""}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* The reference's four labels under the lot grid, filled from the
                lot that is selected. */}
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-5">
              <div>
                <dt className="text-xs text-muted-foreground">Charge</dt>
                <dd>{orDash(chosenLot?.charge ?? null)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Internal charge</dt>
                <dd>{orDash(chosenLot?.internalCharge ?? null)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Location</dt>
                <dd>{orDash(chosenLot?.locationName ?? null)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Purchase</dt>
                <dd>
                  {chosenLot
                    ? [
                        chosenLot.receiptDate
                          ? formatDateColumn(chosenLot.receiptDate)
                          : null,
                        chosenLot.purchaseOrderId
                          ? `IO${chosenLot.purchaseOrderId}`
                          : null,
                        chosenLot.supplierName,
                      ]
                        .filter(Boolean)
                        .join(" / ") || "—"
                    : "—"}
                </dd>
              </div>
              {/* The lot's processing, on the right as the reference prints
                  it (`Grinding (K320), Laser Foil`). */}
              <div>
                <dt className="text-xs text-muted-foreground">Options</dt>
                <dd>{orDash(chosenLot?.options ?? null)}</dd>
              </div>
              {/* The lot's remark, in red under the grid as the reference
                  prints it (`Shorter`). */}
              {chosenLot?.remark && (
                <div className="col-span-full">
                  <dd className="text-destructive">{chosenLot.remark}</dd>
                </div>
              )}
            </dl>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={resetDialog}
            disabled={isPending}
          >
            <RotateCcw className="size-4" />
            Reset dialog
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={restoreDefaults}
            disabled={isPending}
          >
            Default settings
          </Button>
          {!productOnly && (
            <Button
              type="button"
              variant="outline"
              disabled={!chosenLot || filters.tab !== "stock" || isPending}
              onClick={() => {
                if (chosenLot) {
                  showReservations(chosenLot.uuid);
                }
              }}
            >
              <ListChecks className="size-4" />
              Reservations…
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
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

      {reservations && (
        <StockReservationsDialog
          data={reservations}
          open
          onOpenChange={(next) => {
            if (!next) {
              setReservations(null);
            }
          }}
        />
      )}
    </Dialog>
  );
};
