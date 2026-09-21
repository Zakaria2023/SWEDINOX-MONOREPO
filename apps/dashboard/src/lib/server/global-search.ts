import "server-only";

import { db } from "@/db";
import { Charges } from "@/db/schema/charges";
import { Companies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { Complaints } from "@/db/schema/complaints";
import { Contacts } from "@/db/schema/contacts";
import { CounterOrders } from "@/db/schema/counter-orders";
import { Invoices } from "@/db/schema/invoices";
import { Orders } from "@/db/schema/orders";
import { Products } from "@/db/schema/products";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { Quotes } from "@/db/schema/quotes";
import { ReturnOrders } from "@/db/schema/return-orders";
import { Stock } from "@/db/schema/stock";
import { Texts } from "@/db/schema/texts";
import { contactPersonName } from "@/lib/helpers";
import { and, eq, like, or, sql, SQL } from "drizzle-orm";
import { MySqlColumn } from "drizzle-orm/mysql-core";

/**
 * What the user typed, in the three shapes a query needs it.
 *
 * `digits` is set only when the whole term is a number, and it is what makes
 * typing `100742` find order 100742 rather than every row with those six
 * characters somewhere inside it.
 */
export type SearchTerm = {
  raw: string;
  like: string;
  prefix: string;
  digits: number | null;
};

/** One record the term was found on. */
export type SearchHit = {
  /** What to show first — the thing the user was probably looking for. */
  title: string;
  /** Where it was found, in words: the customer, the order, the product. */
  subtitle: string | null;
  /** The column the term actually matched, so a hit never looks arbitrary. */
  matchedOn: string;
  href: string;
};

/** The hits on one screen. */
export type SearchGroup = {
  key: string;
  /** The screen, as the sidebar names it. */
  screen: string;
  /** That screen with the same term already in its search box. */
  href: string;
  hits: SearchHit[];
  /** True when the screen holds more than the few shown here. */
  hasMore: boolean;
};

export type SearchResults = {
  term: string;
  groups: SearchGroup[];
  /** How many records were found, across every screen. */
  total: number;
};

type SearchSource = {
  key: string;
  screen: string;
  /** The overview the hits belong to; the term is handed to its own search. */
  path: string;
  find: (term: SearchTerm, limit: number) => Promise<SearchHit[]>;
};

/** How many hits each screen contributes before it is summarised. */
const HITS_PER_SCREEN = 5;

/** Below this a term matches half the database and helps nobody. */
const MINIMUM_TERM_LENGTH = 2;

export const parseSearchTerm = (raw: string): SearchTerm | null => {
  const trimmed = raw.trim();
  if (trimmed.length < MINIMUM_TERM_LENGTH) {
    return null;
  }
  // Escape what LIKE treats as wildcards, or a stray % matches everything.
  const escaped = trimmed.replace(/[\\%_]/g, (character) => `\\${character}`);
  const digits = /^\d+$/.test(trimmed) ? Number(trimmed) : null;

  return {
    raw: trimmed,
    like: `%${escaped}%`,
    prefix: `${escaped}%`,
    digits: digits !== null && Number.isSafeInteger(digits) ? digits : null,
  };
};

/** Any of the given text columns containing the term. */
const anyOf = (term: SearchTerm, columns: MySqlColumn[]): SQL | undefined =>
  or(...columns.map((column) => like(column, term.like)));

/**
 * The term as an exact record number, when it is a number at all.
 *
 * Kept separate from the text match so that `100742` ranks the order with that
 * number above the ones that merely mention it.
 */
const asNumber = (term: SearchTerm, column: MySqlColumn): SQL | undefined =>
  term.digits === null ? undefined : eq(column, term.digits);

const named = (value: string | null, fallback: string): string =>
  value && value.trim() !== "" ? value : fallback;

/**
 * Where the search looks.
 *
 * Each source owns one screen: it knows how to find its own records and where
 * to send the user for the rest of them. Adding a screen to the search is
 * adding an entry here — nothing else in the search has to change.
 *
 * The order is the order the groups appear in when they tie on hit count, and
 * it runs from what people look up most to what they look up least.
 */
const SOURCES: SearchSource[] = [
  {
    key: "companies",
    screen: "Companies",
    path: "/companies",
    find: async (term, limit) => {
      const rows = await db
        .select({
          uuid: Companies.uuid,
          id: Companies.id,
          companyName: Companies.companyName,
          searchCode3: Companies.searchCode3,
          vatNumber: Companies.vatNumber,
          debtorNumber: Companies.debtorNumber,
        })
        .from(Companies)
        .where(
          or(
            asNumber(term, Companies.id),
            anyOf(term, [
              Companies.companyName,
              Companies.searchCode1,
              Companies.searchCode2,
              Companies.searchCode3,
              Companies.vatNumber,
              Companies.debtorNumber,
              Companies.remarks,
            ]),
          ),
        )
        .orderBy(sql`${Companies.companyName} = ${term.raw} DESC`)
        .limit(limit);

      return rows.map((row) => ({
        title: named(row.companyName, `Company ${row.id}`),
        subtitle: `Code ${row.id}`,
        matchedOn:
          term.digits === row.id
            ? "company code"
            : row.vatNumber?.includes(term.raw)
              ? "VAT number"
              : row.debtorNumber?.includes(term.raw)
                ? "debtor number"
                : "name or search code",
        href: `/companies/${row.uuid}`,
      }));
    },
  },
  {
    key: "contacts",
    screen: "Contact persons",
    path: "/contact-persons-customers-and-prospects",
    find: async (term, limit) => {
      const rows = await db
        .select({
          uuid: Contacts.uuid,
          salutation: Contacts.salutation,
          firstName: Contacts.firstName,
          lastName: Contacts.lastName,
          email: Contacts.email,
          companyName: Companies.companyName,
        })
        .from(Contacts)
        .leftJoin(Companies, eq(Contacts.companyUuid, Companies.uuid))
        .where(
          anyOf(term, [
            Contacts.firstName,
            Contacts.lastName,
            Contacts.email,
            Contacts.telephone,
            Contacts.mobile,
          ]),
        )
        .limit(limit);

      return rows.map((row) => ({
        title: named(
          contactPersonName({
            salutation: row.salutation,
            firstName: row.firstName,
            lastName: row.lastName,
          }),
          "Contact",
        ),
        subtitle: row.companyName,
        matchedOn: row.email?.includes(term.raw) ? "e-mail" : "name or phone",
        href: `/contact-persons-customers-and-prospects`,
      }));
    },
  },
  {
    key: "products",
    screen: "Products",
    path: "/products",
    find: async (term, limit) => {
      const rows = await db
        .select({
          uuid: Products.uuid,
          productCode: Products.productCode,
          name: Products.name,
          commodityCode: Products.commodityCode,
        })
        .from(Products)
        .where(
          anyOf(term, [
            Products.productCode,
            Products.name,
            Products.commodityCode,
          ]),
        )
        .orderBy(sql`${Products.productCode} = ${term.raw} DESC`)
        .limit(limit);

      return rows.map((row) => ({
        title: named(row.productCode, "Product"),
        subtitle: row.name,
        matchedOn: row.commodityCode?.includes(term.raw)
          ? "commodity code"
          : "product code or description",
        href: `/products/${row.uuid}`,
      }));
    },
  },
  {
    key: "orders",
    screen: "Orders",
    path: "/orders",
    find: async (term, limit) => {
      const rows = await db
        .select({
          uuid: Orders.uuid,
          id: Orders.id,
          ourReference: Orders.ourReference,
          customerRef: Orders.customerRef,
          companyName: Companies.companyName,
        })
        .from(Orders)
        .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
        .where(
          or(
            asNumber(term, Orders.id),
            anyOf(term, [Orders.ourReference, Orders.customerRef]),
          ),
        )
        .orderBy(sql`${Orders.id} = ${term.digits ?? 0} DESC`)
        .limit(limit);

      return rows.map((row) => ({
        title: `Order ${row.id}`,
        subtitle: row.companyName,
        matchedOn:
          term.digits === row.id ? "order number" : "our or customer reference",
        href: `/orders/${row.uuid}`,
      }));
    },
  },
  {
    key: "quotes",
    screen: "Quotes",
    path: "/quotes",
    find: async (term, limit) => {
      const rows = await db
        .select({
          uuid: Quotes.uuid,
          id: Quotes.id,
          companyName: Companies.companyName,
        })
        .from(Quotes)
        .leftJoin(Companies, eq(Quotes.companyUuid, Companies.uuid))
        .where(
          or(
            asNumber(term, Quotes.id),
            anyOf(term, [Quotes.ourReference, Quotes.customerRef]),
          ),
        )
        .limit(limit);

      return rows.map((row) => ({
        title: `Quote ${row.id}`,
        subtitle: row.companyName,
        matchedOn: term.digits === row.id ? "quote number" : "reference",
        href: `/quotes/${row.uuid}`,
      }));
    },
  },
  {
    key: "return-orders",
    screen: "Return orders",
    path: "/return-orders",
    find: async (term, limit) => {
      const rows = await db
        .select({
          uuid: ReturnOrders.uuid,
          id: ReturnOrders.id,
          companyName: Companies.companyName,
        })
        .from(ReturnOrders)
        .leftJoin(Companies, eq(ReturnOrders.companyUuid, Companies.uuid))
        .where(
          or(
            asNumber(term, ReturnOrders.id),
            anyOf(term, [
              ReturnOrders.ourReference,
              ReturnOrders.customerRef,
              ReturnOrders.complaintRef,
            ]),
          ),
        )
        .limit(limit);

      return rows.map((row) => ({
        title: `Return order ${row.id}`,
        subtitle: row.companyName,
        matchedOn: term.digits === row.id ? "return number" : "reference",
        href: `/return-orders/${row.uuid}`,
      }));
    },
  },
  {
    key: "counter-orders",
    screen: "Counter orders",
    path: "/counter-orders",
    find: async (term, limit) => {
      const rows = await db
        .select({
          uuid: CounterOrders.uuid,
          id: CounterOrders.id,
          companyName: Companies.companyName,
        })
        .from(CounterOrders)
        .leftJoin(Companies, eq(CounterOrders.companyUuid, Companies.uuid))
        .where(
          or(
            asNumber(term, CounterOrders.id),
            anyOf(term, [
              CounterOrders.ourReference,
              CounterOrders.customerRef,
            ]),
          ),
        )
        .limit(limit);

      return rows.map((row) => ({
        title: `Counter order ${row.id}`,
        subtitle: row.companyName,
        matchedOn:
          term.digits === row.id ? "counter order number" : "reference",
        href: `/counter-orders/${row.uuid}`,
      }));
    },
  },
  {
    key: "invoices",
    screen: "Invoices",
    path: "/invoices",
    find: async (term, limit) => {
      const rows = await db
        .select({
          uuid: Invoices.uuid,
          id: Invoices.id,
          debtorNo: Invoices.debtorNo,
          companyName: Companies.companyName,
        })
        .from(Invoices)
        .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
        .where(
          or(
            asNumber(term, Invoices.id),
            anyOf(term, [Invoices.debtorNo, Invoices.explanation]),
          ),
        )
        .limit(limit);

      return rows.map((row) => ({
        title: `Invoice ${row.id}`,
        subtitle: row.companyName,
        matchedOn:
          term.digits === row.id ? "invoice number" : "debtor number or note",
        href: `/invoices/${row.uuid}`,
      }));
    },
  },
  {
    key: "purchase-orders",
    screen: "Purchase orders",
    path: "/purchase-orders",
    find: async (term, limit) => {
      const rows = await db
        .select({
          uuid: PurchaseOrders.uuid,
          id: PurchaseOrders.id,
          companyName: Companies.companyName,
        })
        .from(PurchaseOrders)
        .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
        .where(
          or(
            asNumber(term, PurchaseOrders.id),
            anyOf(term, [PurchaseOrders.ourReference]),
          ),
        )
        .limit(limit);

      return rows.map((row) => ({
        title: `Purchase order ${row.id}`,
        subtitle: row.companyName,
        matchedOn:
          term.digits === row.id ? "purchase order number" : "our reference",
        href: `/purchase-orders/${row.uuid}`,
      }));
    },
  },
  {
    key: "stock",
    screen: "Stock",
    path: "/stock",
    find: async (term, limit) => {
      const rows = await db
        .select({
          uuid: Stock.uuid,
          charge: Stock.charge,
          internalBatch: Stock.internalBatch,
          quality: Stock.quality,
          productCode: Products.productCode,
        })
        .from(Stock)
        .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
        .where(
          anyOf(term, [
            Stock.charge,
            Stock.internalBatch,
            Stock.quality,
            Stock.stockCategory,
          ]),
        )
        .limit(limit);

      return rows.map((row) => ({
        title: named(row.charge ?? row.internalBatch ?? null, "Stock lot"),
        subtitle: row.productCode,
        matchedOn: row.quality?.includes(term.raw)
          ? "quality code"
          : "charge or internal batch",
        href: `/stock`,
      }));
    },
  },
  {
    key: "complaints",
    screen: "Complaints",
    path: "/complaints",
    find: async (term, limit) => {
      const rows = await db
        .select({
          uuid: Complaints.uuid,
          id: Complaints.id,
          description: Complaints.description,
          companyName: Companies.companyName,
        })
        .from(Complaints)
        .leftJoin(Companies, eq(Complaints.companyUuid, Companies.uuid))
        .where(
          or(
            asNumber(term, Complaints.id),
            anyOf(term, [
              Complaints.description,
              Complaints.explanationOfCause,
              Complaints.explanationOfSolution,
            ]),
          ),
        )
        .limit(limit);

      return rows.map((row) => ({
        title: `Complaint ${row.id}`,
        subtitle: row.companyName,
        matchedOn: term.digits === row.id ? "complaint number" : "description",
        href: `/complaints/${row.uuid}`,
      }));
    },
  },
  {
    key: "charges",
    screen: "Charges",
    path: "/charges",
    find: async (term, limit) => {
      const rows = await db
        .select({
          uuid: Charges.uuid,
          code: Charges.code,
          surcharge: Charges.surcharge,
          companyName: Companies.companyName,
        })
        .from(Charges)
        .leftJoin(Companies, eq(Charges.companyUuid, Companies.uuid))
        .where(anyOf(term, [Charges.code, Charges.surcharge, Charges.contract]))
        .limit(limit);

      return rows.map((row) => ({
        title: named(row.code, "Charge"),
        subtitle: row.surcharge ?? row.companyName,
        matchedOn: "code, surcharge or contract",
        href: `/charges/${row.uuid}`,
      }));
    },
  },
  {
    key: "addresses",
    screen: "Addresses",
    path: "/addresses",
    find: async (term, limit) => {
      const rows = await db
        .select({
          uuid: CompanyAddresses.uuid,
          streetAndNo: CompanyAddresses.streetAndNo,
          postalCode: CompanyAddresses.postalCode,
          city: CompanyAddresses.city,
          companyName: Companies.companyName,
        })
        .from(CompanyAddresses)
        .leftJoin(Companies, eq(CompanyAddresses.companyUuid, Companies.uuid))
        .where(
          anyOf(term, [
            CompanyAddresses.streetAndNo,
            CompanyAddresses.postalCode,
            CompanyAddresses.city,
            CompanyAddresses.email,
            CompanyAddresses.telephone,
          ]),
        )
        .limit(limit);

      return rows.map((row) => ({
        title: [row.streetAndNo, row.postalCode, row.city]
          .filter(Boolean)
          .join(", "),
        subtitle: row.companyName,
        matchedOn: "address, phone or e-mail",
        href: `/addresses/${row.uuid}`,
      }));
    },
  },
  {
    key: "texts",
    screen: "Texts",
    path: "/texts",
    find: async (term, limit) => {
      const rows = await db
        .select({
          uuid: Texts.uuid,
          textBlock: Texts.textBlock,
          companyName: Companies.companyName,
        })
        .from(Texts)
        .leftJoin(Companies, eq(Texts.companyUuid, Companies.uuid))
        .where(and(anyOf(term, [Texts.textBlock])))
        .limit(limit);

      return rows.map((row) => ({
        // A note is a paragraph; the first line is what identifies it.
        title: row.textBlock.split("\n")[0]?.slice(0, 120) ?? "Text",
        subtitle: row.companyName,
        matchedOn: "note",
        href: `/texts/${row.uuid}`,
      }));
    },
  },
];

/**
 * Everything in the system that matches what the user typed.
 *
 * Each screen is asked separately and one after another, because this database
 * caps connections and a search that opens fourteen at once is how that cap
 * gets hit. Every screen is asked for one hit more than it will show, which is
 * what tells the user there is more to see without a second count query.
 *
 * A screen that fails is skipped rather than failing the search: a missing
 * table on one screen should not stop somebody finding an order.
 */
export const globalSearch = async (raw: string): Promise<SearchResults> => {
  const term = parseSearchTerm(raw);
  if (!term) {
    return { term: raw.trim(), groups: [], total: 0 };
  }

  const groups: SearchGroup[] = [];
  for (const source of SOURCES) {
    try {
      const hits = await source.find(term, HITS_PER_SCREEN + 1);
      if (hits.length === 0) {
        continue;
      }
      groups.push({
        key: source.key,
        screen: source.screen,
        href: `${source.path}?q=${encodeURIComponent(term.raw)}`,
        hits: hits.slice(0, HITS_PER_SCREEN),
        hasMore: hits.length > HITS_PER_SCREEN,
      });
    } catch {
      continue;
    }
  }

  return {
    term: term.raw,
    groups,
    total: groups.reduce((sum, group) => sum + group.hits.length, 0),
  };
};
