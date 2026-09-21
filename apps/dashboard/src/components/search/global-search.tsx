"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEventHandler,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { Search } from "lucide-react";
import { searchEverything } from "@/app/(dashboard)/search/actions";
import { SearchResults } from "@/lib/server/global-search";

/**
 * One box that searches the whole system.
 *
 * It waits for a pause in the typing before asking the server, because every
 * keystroke would otherwise open a query against each screen in turn, and this
 * database caps connections. Pressing Enter goes to the full results page
 * without waiting for the preview at all.
 */
const PAUSE_BEFORE_SEARCHING_MS = 300;

/** Below this a term matches half the database and helps nobody. */
const MINIMUM_TERM_LENGTH = 2;

export const GlobalSearch = () => {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isOpen, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (term.trim().length < MINIMUM_TERM_LENGTH) {
      setResults(null);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const found = await searchEverything(term);
        setResults(found);
        setOpen(true);
      });
    }, PAUSE_BEFORE_SEARCHING_MS);

    return () => clearTimeout(timer);
  }, [term]);

  // A click anywhere else puts the preview away.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (term.trim().length < MINIMUM_TERM_LENGTH) {
      return;
    }
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={onSubmit}>
        <label htmlFor="global-search" className="sr-only">
          Search everything
        </label>
        <div className="relative">
          <Search className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="global-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onFocus={() => results && setOpen(true)}
            placeholder="Search anything — a code, a number, a name, a note…"
            className="h-8 w-full rounded-lg border border-border bg-background ps-8 pe-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </form>

      {isOpen && results ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-background shadow-lg">
          {results.groups.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {isPending ? "Searching…" : `Nothing found for “${results.term}”`}
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {results.groups.map((group) => (
                <div key={group.key} className="border-b last:border-b-0">
                  <p className="bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                    {group.screen}
                  </p>
                  {group.hits.map((hit, index) => (
                    <Link
                      key={`${group.key}-${index}`}
                      href={hit.href}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 text-sm hover:bg-muted/40"
                    >
                      <span className="font-medium">{hit.title}</span>
                      {hit.subtitle ? (
                        <span className="ms-2 text-muted-foreground">
                          {hit.subtitle}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                  {group.hasMore ? (
                    <Link
                      href={group.href}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 text-xs text-primary hover:underline"
                    >
                      See all {group.screen.toLowerCase()} matching “
                      {results.term}”
                    </Link>
                  ) : null}
                </div>
              ))}
              <Link
                href={`/search?q=${encodeURIComponent(results.term)}`}
                onClick={() => setOpen(false)}
                className="block bg-muted/30 px-3 py-2 text-center text-xs font-medium text-primary hover:underline"
              >
                See every result
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
