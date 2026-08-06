import { countLabel, formatNumber } from "@/lib/helpers";

/**
 * Every overview is searched, filtered, sorted and paged on the server, and the
 * state of that view lives in the URL rather than in component state. Three
 * things follow from that, and all three are the reason for it:
 *
 *   - Only the rows being looked at cross the wire. Several of these tables —
 *     order lines, journal entries, stock movements — grow without bound, and
 *     the alternative is shipping the whole table to the browser to sift there.
 *   - A view is a link. "The blocked orders for this customer" can be sent to
 *     somebody rather than described to them.
 *   - It survives the router.refresh() a row action triggers, because the
 *     server component re-runs against the same search params.
 *
 * This module is the whole contract between a page's search params and the
 * action that reads them, and it is deliberately free of anything server-side:
 * the toolbar that writes these params is a client component and reads the same
 * definitions. Turning them into SQL is lib/server/table-query.ts.
 */

export type SortDirection = "asc" | "desc";

/** The state of one table view, parsed out of the URL. */
export type TableQuery = {
  /** 1-based, always at least 1. */
  page: number;
  pageSize: number;
  /** A column key the overview declared as sortable, or null for its default. */
  sort: string | null;
  dir: SortDirection;
  /** The free-text term, trimmed; null when the box is empty. */
  q: string | null;
  /**
   * Everything else in the URL, always as an array so a single-select and a
   * multi-select filter read the same way.
   */
  filters: Record<string, string[]>;
};

/** One page of rows, plus what it is a page of. */
export type Paged<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** The shape Next hands a page component in searchParams. */
export type SearchParams = Record<string, string | string[] | undefined>;

/**
 * One filter control an overview offers, as plain data the toolbar renders.
 *
 * Deliberately separate from the binding that turns the same key into SQL: a
 * binding closes over a Drizzle column, which cannot be serialised to a client
 * component. The two are keyed by the same string, so a control and its query
 * are declared together even though they cannot live in the same object.
 *
 * A relation filter — a customer, a supplier, a product — is a `select` whose
 * options were loaded on the server. It needs no separate kind, because by the
 * time the toolbar sees it, "which customer" and "which status" are the same
 * question.
 */
export type TableFilterControl =
  | {
      key: string;
      kind: "select";
      label: string;
      options: Array<{ value: string; label: string }>;
      placeholder?: string;
    }
  | { key: string; kind: "dateRange"; label: string }
  | { key: string; kind: "numberRange"; label: string };

/** The two ends of a range filter, which the URL carries as "from..to". */
export const parseRangeValue = (
  value: string | null | undefined,
): { from: string; to: string } => {
  const [from = "", to = ""] = (value ?? "").split("..");
  return { from, to };
};

/**
 * The two ends back into one param, or null when neither end is set — an empty
 * range has to clear the key rather than write "..", which would read as a
 * filter that is on but selects everything.
 */
export const rangeValue = (from: string, to: string): string | null =>
  from || to ? `${from}..${to}` : null;

export const TABLE_PAGE_SIZE = 10;

// The sizes the pager offers. 10 is the default because these tables are wide —
// twenty-odd columns on the line overviews — and a screenful of ten rows is
// what fits without scrolling in two directions at once. The larger sizes stay
// available for anyone scanning rather than reading.
export const TABLE_PAGE_SIZES = [10, 25, 50, 100] as const;

// The keys the table machinery owns. Anything else in the URL is a filter, so
// an overview can add one without touching the parser.
const RESERVED_TABLE_PARAMS = ["page", "size", "sort", "dir", "q"];

const firstValue = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

const toArray = (value: string | string[] | undefined): string[] => {
  if (value === undefined) {
    return [];
  }
  // A repeated param arrives as an array; a comma-separated one as a string.
  // Both mean the same thing to a multi-select, so both are accepted.
  const values = Array.isArray(value) ? value : value.split(",");
  return values.map((entry) => entry.trim()).filter((entry) => entry !== "");
};

/**
 * The search params as the one shape every list action takes.
 *
 * Every value is clamped rather than trusted. A page of -3, a page size of
 * 100000 and a direction of "sideways" are all things a URL can carry, and each
 * of them reaches SQL if the parser lets it — so an unusable value falls back
 * to the default instead of failing the page.
 *
 * `sort` is passed through as a plain string and is NOT trusted here: it is
 * resolved against the overview's own whitelist of sortable columns on the
 * server, so a key nobody declared sorts by nothing rather than by whatever it
 * happens to spell.
 */
export const parseTableQuery = (params: SearchParams): TableQuery => {
  const page = Number(firstValue(params.page));
  const pageSize = Number(firstValue(params.size));
  const dir = firstValue(params.dir);
  const q = (firstValue(params.q) ?? "").trim();

  const filters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(params)) {
    if (RESERVED_TABLE_PARAMS.includes(key)) {
      continue;
    }
    const values = toArray(value);
    if (values.length > 0) {
      filters[key] = values;
    }
  }

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: TABLE_PAGE_SIZES.some((size) => size === pageSize)
      ? pageSize
      : TABLE_PAGE_SIZE,
    sort: firstValue(params.sort) || null,
    dir: dir === "desc" ? "desc" : "asc",
    q: q === "" ? null : q,
    filters,
  };
};

/**
 * The query string for the same view with `patch` applied. A null (or empty)
 * value drops the key, which is how a filter is cleared.
 *
 * Any change other than the page itself returns to page one. A filter that
 * narrows the result to two rows must not leave the reader stranded on page
 * nine looking at an empty table and concluding the filter found nothing.
 */
export const tableQueryString = (
  current: URLSearchParams,
  patch: Record<string, string | string[] | null>,
): string => {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(patch)) {
    next.delete(key);
    const values = value === null ? [] : toArray(value);
    for (const entry of values) {
      next.append(key, entry);
    }
  }

  if (!Object.hasOwn(patch, "page")) {
    next.delete("page");
  }

  return next.toString();
};

/**
 * How many pages a result set has — always at least one, so an empty table
 * reads as "page 1 of 1" rather than "page 1 of 0".
 */
export const totalPages = (total: number, pageSize: number): number =>
  Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

/**
 * What a pager says it is showing: "51–100 of 1,284 invoices". An empty result
 * says so in words, since "0–0 of 0" is only arithmetic.
 *
 * The plural is a parameter rather than the singular with an "s", because half
 * the nouns these tables count are irregular — a page of "companys" reads as a
 * bug in the screen.
 */
export const pageRangeLabel = <T>(
  page: Paged<T>,
  singular = "row",
  plural = `${singular}s`,
): string => {
  if (page.total === 0) {
    return `No ${plural}`;
  }
  const first = (page.page - 1) * page.pageSize + 1;
  const last = Math.min(page.total, first + page.rows.length - 1);
  return `${formatNumber(first)}–${formatNumber(last)} of ${countLabel(
    page.total,
    singular,
    plural,
  )}`;
};

/** An empty page, for an action that can answer without querying at all. */
export const emptyPage = <T>(query: TableQuery): Paged<T> => ({
  rows: [],
  total: 0,
  page: query.page,
  pageSize: query.pageSize,
});
