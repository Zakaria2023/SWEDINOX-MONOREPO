"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  StockSearchChoice,
  StockSearchDialog,
} from "@/components/orders/stock-search-dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import type { StockSearchSource } from "@/lib/server/stock-search";

/**
 * What a line learns when somebody picks an article.
 *
 * More than the uuid, because a document line carries the article's dimensions
 * and quality in its own columns — a receival that cannot see the line's
 * dimensions cannot weigh the parcel it receives.
 */
export type ProductChoice = {
  productUuid: string;
  productCode: string | null;
  productName: string | null;
  quality: string | null;
  lengthMm: number | null;
  widthMm: number | null;
  thicknessMm: string | null;
  /**
   * What one piece weighs. A purchase line is priced per tonne, so this is what
   * turns a quantity into an amount — and the reference shows it on the line as
   * `Kg(p)` the moment an article is chosen, rather than at save time.
   */
  pieceWeightKg: number | null;
  /** The article's own purchase unit — the reference's `Per`, usually `TN`. */
  purchasingUnit: string | null;
};

type Props = {
  id?: string;
  /** The chosen article's uuid, held by the form. */
  value: string;
  onChange: (choice: ProductChoice) => void;
  /** What to show before anybody has picked — used when editing a saved line. */
  initialLabel?: string | null;
  /**
   * Which sources the dialog may search. A **buying** document searches the
   * catalogue; a **selling** one searches the shelf.
   */
  sources?: StockSearchSource[];
  invalid?: boolean;
  disabled?: boolean;
};

const labelFor = (choice: StockSearchChoice): string => {
  const row = choice.kind === "lot" ? choice.lot : choice.variant;
  return [row.productCode, row.productName].filter(Boolean).join(" — ");
};

/**
 * The way a document line names an article.
 *
 * 🔴 Never a dropdown. The reference opens a window titled `Stock` — filters on
 * product code, search code, quality and the three dimensions, each with a ±5 %
 * `Search with margin`, because a customer asking for a 3000 mm plate will take
 * a 2950 one. A `<select>` cannot do dimensional search, and scoping one to a
 * single company's linked products is how a form ends up offering one article
 * out of 5 626.
 */
export const ProductSearchField = ({
  id,
  value,
  onChange,
  initialLabel,
  sources,
  invalid,
  disabled,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(initialLabel ?? "");

  // A buying document has no use for the shelf, and no parcel to bind to.
  const buying = (sources ?? []).includes("catalogue");

  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        readOnly
        value={label}
        placeholder="Search for a product…"
        aria-invalid={invalid}
        onClick={() => {
          if (!disabled) {
            setOpen(true);
          }
        }}
        className="cursor-pointer"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Search products"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
      </Button>

      <StockSearchDialog
        open={open}
        onOpenChange={setOpen}
        sources={sources}
        productOnly={buying}
        initialProductCode={null}
        onChoose={(choice) => {
          const row = choice.kind === "lot" ? choice.lot : choice.variant;
          setLabel(labelFor(choice));
          onChange({
            productUuid: row.productUuid,
            productCode: row.productCode,
            productName: row.productName,
            quality: row.quality,
            lengthMm: row.lengthMm,
            widthMm: row.widthMm,
            thicknessMm: row.thicknessMm,
            pieceWeightKg: row.pieceWeightKg,
            purchasingUnit: row.purchasingUnit,
          });
          setOpen(false);
        }}
      />
      {/* The form holds the uuid; the box above is only what a person reads. */}
      <input type="hidden" value={value} readOnly />
    </div>
  );
};
