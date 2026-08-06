"use client";

import { Input } from "@/components/shadcn/input";
import { useTableQuery } from "@/hooks/use-table-query";
import { cn } from "@/lib/helpers";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  placeholder?: string;
  className?: string;
};

// How long the box waits after the last keystroke before it queries. Short
// enough to feel immediate, long enough that typing a company name is one
// request rather than eleven.
const DEBOUNCE_MS = 300;

export const TableSearch = ({ placeholder = "Search…", className }: Props) => {
  const { value, setParams, isPending } = useTableQuery();
  const urlTerm = value("q");
  const [term, setTerm] = useState(urlTerm);

  // The box is typed into far faster than the URL can follow, so it holds its
  // own value while the user types. This pulls it back in step when the URL
  // changes for a reason other than typing — the back button, a cleared filter,
  // a link someone opened.
  useEffect(() => {
    setTerm(urlTerm);
  }, [urlTerm]);

  useEffect(() => {
    if (term === urlTerm) {
      return;
    }
    const timer = setTimeout(
      () => setParams({ q: term.trim() || null }),
      DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [term, urlTerm, setParams]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn("ps-8", term && "pe-8", isPending && "opacity-70")}
      />
      {term && (
        <button
          type="button"
          onClick={() => setTerm("")}
          className="absolute top-1/2 end-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
          <span className="sr-only">Clear search</span>
        </button>
      )}
    </div>
  );
};
