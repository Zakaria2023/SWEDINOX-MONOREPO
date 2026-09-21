import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SearchResults } from "@/lib/server/global-search";

type Props = {
  results: SearchResults;
};

/**
 * The hits, grouped by the screen they live on.
 *
 * Every group carries a link to that screen with the same term already in its
 * search box, so a search that finds more than it can show hands the user
 * straight to the full, filtered list rather than stopping at five.
 */
export const SearchResultsList = ({ results }: Props) => {
  if (!results.term) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-10 text-center">
        <p className="font-medium">Search the whole system</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          A code, a number, a name, a postcode, a charge, a word from a note —
          anything stored anywhere. The results are grouped by the screen they
          live on.
        </p>
      </div>
    );
  }

  if (results.groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-10 text-center">
        <p className="font-medium">Nothing found for “{results.term}”</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Try a shorter term, or part of a name or number rather than the whole
          of it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {results.total} {results.total === 1 ? "record" : "records"} across{" "}
        {results.groups.length}{" "}
        {results.groups.length === 1 ? "screen" : "screens"}.
      </p>

      {results.groups.map((group) => (
        <section key={group.key} className="space-y-2">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-base font-semibold">{group.screen}</h2>
            <Link
              href={group.href}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {group.hasMore ? "See all on this screen" : "Open the screen"}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <ul className="divide-y rounded-lg border">
            {group.hits.map((hit, index) => (
              <li key={`${group.key}-${index}`}>
                <Link
                  href={hit.href}
                  className="flex items-baseline justify-between gap-4 px-4 py-3 hover:bg-muted/40"
                >
                  <span className="min-w-0">
                    <span className="font-medium">{hit.title}</span>
                    {hit.subtitle ? (
                      <span className="ms-2 text-sm text-muted-foreground">
                        {hit.subtitle}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    matched on {hit.matchedOn}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
