import "server-only";

import { Paged, TableQuery } from "@/lib/table-query";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  like,
  lte,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import { MySqlColumn } from "drizzle-orm/mysql-core";

/**
 * How one declared filter turns into SQL.
 *
 * A binding is a function rather than a column reference because the shapes a
 * filter takes do not all reduce to "column = value": a company role lives in a
 * JSON array, a date range is two comparisons, a relation filter matches a
 * joined table's uuid. Handing each overview a function lets all of them be
 * expressed the same way, and lets an unusual one be expressed at all.
 *
 * Returning undefined means "this filter selects everything", which is what an
 * empty or unrecognised value must do — a filter nobody set cannot be allowed
 * to narrow the result.
 */
export type FilterBinding = (values: string[]) => SQL | undefined;

/** An overview's filters, keyed by the same string its UI controls use. */
export type FilterBindings = Record<string, FilterBinding>;

/** The columns an overview declares sortable, keyed by the URL's sort value. */
export type SortableColumns = Record<string, MySqlColumn | SQL>;

export type TableWhereInput = {
  query: TableQuery;
  /** Columns the free-text term is matched against, ORed together. */
  search?: readonly MySqlColumn[];
  filters?: FilterBindings;
  /** Conditions the overview always applies, whatever the URL says. */
  scope?: Array<SQL | undefined>;
};

/**
 * The free-text condition: the term against every declared column, ORed.
 *
 * The term is matched anywhere in the value rather than as a prefix, because
 * staff search for the fragment they remember — half a company name, the tail
 * of a reference. That costs the index, which is the trade this system can
 * afford and part of the reason paging exists.
 *
 * The wildcards a LIKE pattern reserves are escaped, so searching for "50%"
 * looks for that text instead of matching every row.
 */
export const searchCondition = (
  columns: readonly MySqlColumn[],
  q: string | null,
): SQL | undefined => {
  const term = (q ?? "").trim();
  if (term === "" || columns.length === 0) {
    return undefined;
  }
  const escaped = term.replace(/[\\%_]/g, (character) => `\\${character}`);
  return or(...columns.map((column) => like(column, `%${escaped}%`)));
};

/**
 * Every filter in the URL that the overview declared a binding for.
 *
 * A key with no binding is ignored rather than rejected. The URL is user input:
 * a stale link, a hand-typed param or a filter that has since been removed must
 * leave the reader with an unfiltered table, not an error page.
 */
export const filterConditions = (
  bindings: FilterBindings,
  filters: TableQuery["filters"],
): Array<SQL | undefined> =>
  Object.entries(filters).map(([key, values]) => bindings[key]?.(values));

/**
 * Everything narrowing an overview's rows, as one condition: what it always
 * applies, what was searched for, and what was filtered on.
 */
export const tableWhere = ({
  query,
  search = [],
  filters = {},
  scope = [],
}: TableWhereInput): SQL | undefined =>
  and(
    ...scope,
    searchCondition(search, query.q),
    ...filterConditions(filters, query.filters),
  );

/**
 * How the rows are ordered.
 *
 * The URL's sort key is resolved against the overview's own whitelist and is
 * never used to build SQL directly. An unknown key falls back to the overview's
 * natural order, so a stale link sorts by something sensible instead of failing
 * — and a hand-typed one cannot name a column that was never meant to be
 * exposed.
 *
 * `tiebreak` must be unique per row, and is required rather than optional
 * because paging without one is silently broken. Sorting a hundred addresses by
 * city puts every Rotterdam row in a group the database may return in any order
 * it likes, and it need not pick the same order twice — so LIMIT 50 OFFSET 50
 * can hand back a row page one already showed, while another is never shown at
 * all. Appending a unique column makes the ordering total, which is what makes
 * one page the complement of the others rather than a sample of them.
 */
export const tableOrderBy = (
  sortable: SortableColumns,
  query: TableQuery,
  fallback: SQL[],
  tiebreak: MySqlColumn | SQL,
): SQL[] => {
  const column = query.sort ? sortable[query.sort] : undefined;
  const direction = query.dir === "desc" ? desc : asc;
  return [
    ...(column ? [direction(column)] : fallback),
    // Same direction as the sort, so ties read in the order the rest of the
    // page does rather than against it.
    direction(tiebreak),
  ];
};

/** The window of rows one page covers. */
export const tablePage = (
  query: TableQuery,
): { limit: number; offset: number } => ({
  limit: query.pageSize,
  offset: (query.page - 1) * query.pageSize,
});

/**
 * Runs an overview's two queries and wraps them in the paged envelope.
 *
 * The rows and the count are separate queries because the count has to ignore
 * the window the rows are limited to, and they run one after the other rather
 * than together on purpose: the database this app talks to caps concurrent
 * connections, and a page request that fans out is how a busy overview starts
 * failing to load rather than merely loading slowly.
 *
 * Each overview supplies both, because only it knows which joins its own
 * filters need.
 */
export const runPaged = async <T>(
  query: TableQuery,
  run: {
    rows: (limit: number, offset: number) => Promise<T[]>;
    count: () => Promise<number>;
  },
): Promise<Paged<T>> => {
  const { limit, offset } = tablePage(query);
  const rows = await run.rows(limit, offset);
  const total = await run.count();

  return { rows, total, page: query.page, pageSize: query.pageSize };
};

// ---------------------------------------------------------------------------
// The filter shapes
//
// Every filter on every overview is one of these. They are written once here so
// that "from this date" means the same thing on an invoice as on a purchase
// order, and so an overview's own filter declaration stays a declaration rather
// than a second implementation.
//
// Each takes the column it narrows and returns a binding, so an overview reads
// as a list of what it can be filtered by:
//
//   { status: enumFilter(Orders.status, orderStatuses),
//     orderDate: dateRangeFilter(Orders.orderDate),
//     company: relationFilter(Orders.companyUuid) }
// ---------------------------------------------------------------------------

/**
 * A filter matching one of a fixed set of values — a status, a type, a term.
 * Several values mean any of them.
 *
 * Values outside `allowed` are dropped rather than queried. A URL can name a
 * status that does not exist, and comparing an enum column against one is at
 * best a guaranteed empty result and at worst an error.
 */
export const enumFilter = (
  column: MySqlColumn,
  allowed: readonly string[],
): FilterBinding => {
  const permitted = new Set<string>(allowed);
  return (values) => {
    const wanted = values.filter((value) => permitted.has(value));
    if (wanted.length === 0) {
      return undefined;
    }
    return inArray(column, wanted);
  };
};

/**
 * A filter on a yes/no column. "true" and "false" are the only values that mean
 * anything; anything else leaves the column alone.
 */
export const booleanFilter =
  (column: MySqlColumn): FilterBinding =>
  (values) => {
    const value = values[0];
    if (value !== "true" && value !== "false") {
      return undefined;
    }
    return eq(column, value === "true");
  };

/**
 * A closed or half-open date range, carried in the URL as "from..to".
 *
 * Either end may be left off, because "everything since March" and "everything
 * up to year end" are both things a person asks for. A range with neither end
 * selects everything.
 *
 * 🔴 A column Drizzle reads as a `Date` — every `timestamp`, and a `date`
 * without `mode: "string"` — encodes its bound through `toISOString`, so the
 * typed day has to arrive as a `Date` or the whole query throws
 * (`value.toISOString is not a function`, which is what `Stock mutations`
 * did on its `Moved` filter until 7-10-2026). Its upper end is the end of
 * that day, so `..2026-10-07` includes what happened on the 7th.
 */
export const dateRangeFilter =
  (column: MySqlColumn): FilterBinding =>
  (values) => {
    const [from, to] = (values[0] ?? "").split("..");
    if (column.dataType === "date") {
      const isDay = column.getSQLType() === "date";
      return and(
        from ? gte(column, new Date(`${from}T00:00:00Z`)) : undefined,
        to
          ? lte(
              column,
              new Date(isDay ? `${to}T00:00:00Z` : `${to}T23:59:59.999Z`),
            )
          : undefined,
      );
    }
    return and(
      from ? gte(column, from) : undefined,
      to ? lte(column, to) : undefined,
    );
  };

/**
 * A numeric range — an amount, a weight, a quantity — carried the same way.
 *
 * A non-numeric end is ignored rather than compared, since a decimal column
 * asked to compare itself with a word fails the whole query.
 */
export const numberRangeFilter =
  (column: MySqlColumn): FilterBinding =>
  (values) => {
    const [from, to] = (values[0] ?? "").split("..");
    const lower = Number(from);
    const upper = Number(to);
    return and(
      from && Number.isFinite(lower) ? gte(column, String(lower)) : undefined,
      to && Number.isFinite(upper) ? lte(column, String(upper)) : undefined,
    );
  };

/**
 * A filter on a column holding a JSON array of values — a company's roles, an
 * address's categories. Several values mean any of them.
 *
 * The one filter shape here that cannot use an ordinary index: JSON_CONTAINS
 * has to look inside every row's document. That is acceptable on the tables
 * that carry these columns, which hold one row per company or per address and
 * are small by nature. It would not be on a transaction table — if one ever
 * grows a JSON array worth filtering, the answer is a multi-valued index on the
 * array, not a different query here.
 */
export const jsonArrayFilter =
  (column: MySqlColumn, allowed: readonly string[]): FilterBinding =>
  (values) => {
    const permitted = new Set<string>(allowed);
    const wanted = values.filter((value) => permitted.has(value));
    if (wanted.length === 0) {
      return undefined;
    }
    return or(
      ...wanted.map(
        (value) => sql`JSON_CONTAINS(${column}, ${JSON.stringify(value)})`,
      ),
    );
  };

/**
 * A filter matching a column against one of a set of values chosen from a
 * lookup — a ledger account number, a journal name, a warehouse code. Unlike
 * enumFilter there is no fixed set to validate against, because the legal
 * values live in another table; unlike relationFilter the column is not a uuid.
 *
 * A value that matches nothing simply returns no rows, which is the honest
 * answer to "show me account 9999".
 */
export const valueFilter =
  (column: MySqlColumn): FilterBinding =>
  (values) => {
    const wanted = values.filter((value) => value.trim() !== "");
    if (wanted.length === 0) {
      return undefined;
    }
    return inArray(column, wanted);
  };

/**
 * A filter matching a related record by uuid — a customer, a supplier, a
 * product, a contract. Several uuids mean any of them.
 *
 * The uuid case of valueFilter, named separately because that is what every
 * call site is doing and the name is what makes an overview's filter list
 * readable.
 */
export const relationFilter = valueFilter;
