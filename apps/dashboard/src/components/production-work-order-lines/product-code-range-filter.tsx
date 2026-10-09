"use client";

import { Input } from "@/components/shadcn/input";
import { useTableQuery } from "@/hooks/use-table-query";
import { parseRangeValue, rangeValue } from "@/lib/table-query";
import { useEffect, useState } from "react";

// How long the boxes wait after the last keystroke before they query, the same
// pause the search box takes.
const DEBOUNCE_MS = 300;

/**
 * The reference's `Product code` from/to: two free-text ends of one
 * alphabetical range, written to the URL as `productCode=from..to`.
 *
 * The shared filter controls offer date and number ranges only, so the text
 * range is drawn here. Like the search box it holds its own value while it is
 * typed into and follows the URL when that changes for another reason.
 */
export const ProductCodeRangeFilter = () => {
  const { value, setParams } = useTableQuery();
  const urlValue = value("productCode");
  const [from, setFrom] = useState(parseRangeValue(urlValue).from);
  const [to, setTo] = useState(parseRangeValue(urlValue).to);

  useEffect(() => {
    const range = parseRangeValue(urlValue);
    setFrom(range.from);
    setTo(range.to);
  }, [urlValue]);

  useEffect(() => {
    const next = rangeValue(from.trim(), to.trim());
    if ((next ?? "") === urlValue) {
      return;
    }
    const timer = setTimeout(
      () => setParams({ productCode: next }),
      DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [from, to, urlValue, setParams]);

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="filter-productCode-from"
        className="text-xs font-medium text-muted-foreground"
      >
        Product code
      </label>
      <div className="flex items-center gap-1">
        <Input
          id="filter-productCode-from"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          placeholder="From"
          aria-label="Product code from"
          className="h-8 w-36"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          value={to}
          onChange={(event) => setTo(event.target.value)}
          placeholder="To"
          aria-label="Product code to"
          className="h-8 w-36"
        />
      </div>
    </div>
  );
};
