import { CustomerOverviewRow } from "@/app/(dashboard)/customer-overview/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import {
  customerGroupLabel,
  representativeInitials,
  salesRepresentativeLabel,
} from "@/lib/helpers";

/**
 * The customer overview as a sheet — the reference's columns, in its order.
 *
 * All forty-seven of the reference's columns are here.
 *
 * - `Region number` and `Customer group code` are dead sentinels. Both are `0`
 *   on all 1 679 of its rows (`Customer group code` has a single `30`). The
 *   region and the group have a name and no number here, so both print blank
 *   and are hidden by default.
 * - `Converted quotes` is `0` on every row — no quote in that database has ever
 *   become an order. Ours counts the quotes with a line converted to an order.
 *
 * Everything else the reference shows is here, including the two columns that
 * stamp the reference window onto every row.
 */

export type CustomerOverviewColumnKey =
  | "searchCode3"
  | "companyName"
  | "streetAndNo"
  | "initials"
  | "representative"
  | "quotes"
  | "outstandingQuotes"
  | "outstandingOrders"
  | "orderLines"
  | "orders"
  | "invoices"
  | "invoiceLines"
  | "visits"
  | "visitFrequency"
  | "counterOrders"
  | "counterOrderLines"
  | "outstandingCounterOrders"
  | "returnOrders"
  | "returnOrderLines"
  | "outstandingReturnOrders"
  | "complaints"
  | "outstandingComplaints"
  | "lastOrderDate"
  | "ordersUnder200Eur"
  | "ordersUnder500Eur"
  | "ordersUnder2000Eur"
  | "ordersUnder200Kg"
  | "ordersUnder500Kg"
  | "ordersUnder2000Kg"
  | "customerGroup"
  | "invoicedOrders"
  | "invoicedOrdersRevenue"
  | "avgOrderSize"
  | "referenceFrom"
  | "referenceTo"
  | "city"
  | "postalCode"
  | "searchCode2"
  | "searchCode1"
  | "customerCode"
  | "region"
  | "invoiceEmailEnabled"
  | "invoiceEmailTo"
  | "vatNumber"
  | "regionNumber"
  | "convertedQuotes"
  | "customerGroupCode";

export const CUSTOMER_OVERVIEW_COLUMNS: Array<
  ExportColumn<CustomerOverviewRow, CustomerOverviewColumnKey>
> = [
  {
    key: "searchCode3",
    label: "Searchcode 3",
    defaultVisible: true,
    value: (row) => textCell(row.searchCode3),
  },
  {
    key: "companyName",
    label: "Customer",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "streetAndNo",
    label: "Street + No.",
    defaultVisible: true,
    value: (row) => textCell(row.streetAndNo),
  },
  {
    key: "initials",
    label: "Initials",
    defaultVisible: true,
    value: (row) => textCell(representativeInitials(row.representative)),
  },
  {
    key: "representative",
    label: "Representative",
    defaultVisible: true,
    value: (row) => textCell(salesRepresentativeLabel(row.representative)),
  },
  {
    key: "quotes",
    label: "Quotes",
    defaultVisible: true,
    value: (row) => numberCell(row.quotes),
  },
  {
    key: "convertedQuotes",
    label: "Converted quotes",
    defaultVisible: false,
    // Quotes with at least one line turned into an order. `0` on every
    // reference row — no quote there had ever become an order.
    value: (row) => numberCell(row.convertedQuotes),
  },
  {
    key: "outstandingQuotes",
    label: "Outstanding Quotes",
    defaultVisible: true,
    value: (row) => numberCell(row.outstandingQuotes),
  },
  {
    key: "outstandingOrders",
    label: "Outstanding Orders",
    defaultVisible: true,
    value: (row) => numberCell(row.outstandingOrders),
  },
  {
    key: "orderLines",
    label: "Order lines",
    defaultVisible: true,
    value: (row) => numberCell(row.orderLines),
  },
  {
    key: "orders",
    label: "Orders",
    defaultVisible: true,
    value: (row) => numberCell(row.orders),
  },
  {
    key: "invoices",
    label: "Invoices",
    defaultVisible: true,
    value: (row) => numberCell(row.invoices),
  },
  {
    key: "invoiceLines",
    label: "Invoice lines",
    defaultVisible: true,
    value: (row) => numberCell(row.invoiceLines),
  },
  {
    key: "visits",
    label: "Visit",
    defaultVisible: true,
    value: (row) => numberCell(row.visits),
  },
  {
    key: "visitFrequency",
    label: "Visit frequency",
    defaultVisible: true,
    value: (row) => numberCell(row.visitFrequency),
  },
  {
    key: "counterOrders",
    label: "Counter orders",
    defaultVisible: true,
    value: (row) => numberCell(row.counterOrders),
  },
  {
    key: "counterOrderLines",
    label: "Counter order lines",
    defaultVisible: true,
    value: (row) => numberCell(row.counterOrderLines),
  },
  {
    key: "outstandingCounterOrders",
    label: "Outstanding Counter orders",
    defaultVisible: true,
    value: (row) => numberCell(row.outstandingCounterOrders),
  },
  {
    key: "returnOrders",
    label: "Return orders",
    defaultVisible: true,
    value: (row) => numberCell(row.returnOrders),
  },
  {
    key: "returnOrderLines",
    label: "Return order lines",
    defaultVisible: true,
    value: (row) => numberCell(row.returnOrderLines),
  },
  {
    key: "outstandingReturnOrders",
    label: "Outstanding Return orders",
    defaultVisible: true,
    value: (row) => numberCell(row.outstandingReturnOrders),
  },
  {
    key: "complaints",
    label: "Complaints",
    defaultVisible: true,
    value: (row) => numberCell(row.complaints),
  },
  {
    key: "outstandingComplaints",
    label: "Outstanding Complaints",
    defaultVisible: true,
    value: (row) => numberCell(row.outstandingComplaints),
  },
  {
    key: "lastOrderDate",
    label: "Last order date",
    defaultVisible: true,
    value: (row) => dateCell(row.lastOrderDate),
  },
  {
    key: "ordersUnder200Eur",
    label: "Orders <200 EUR",
    defaultVisible: true,
    value: (row) => numberCell(row.ordersUnder200Eur),
  },
  {
    key: "ordersUnder500Eur",
    label: "Orders <500 EUR",
    defaultVisible: true,
    value: (row) => numberCell(row.ordersUnder500Eur),
  },
  {
    key: "ordersUnder2000Eur",
    label: "Orders <2000 EUR",
    defaultVisible: true,
    value: (row) => numberCell(row.ordersUnder2000Eur),
  },
  {
    key: "ordersUnder200Kg",
    label: "Orders <200 KG",
    defaultVisible: true,
    value: (row) => numberCell(row.ordersUnder200Kg),
  },
  {
    key: "ordersUnder500Kg",
    label: "Orders <500 KG",
    defaultVisible: true,
    value: (row) => numberCell(row.ordersUnder500Kg),
  },
  {
    key: "ordersUnder2000Kg",
    label: "Orders <2000 KG",
    defaultVisible: true,
    value: (row) => numberCell(row.ordersUnder2000Kg),
  },
  {
    key: "customerGroupCode",
    label: "Customer group code",
    defaultVisible: false,
    // `0` on 1 678 of the reference's 1 679 rows; the group has a name and
    // no number here.
    value: () => null,
  },
  {
    key: "customerGroup",
    label: "Customer group",
    defaultVisible: true,
    value: (row) => textCell(customerGroupLabel(row.customerGroup)),
  },
  {
    key: "invoicedOrders",
    label: "Invoiced orders",
    defaultVisible: true,
    value: (row) => numberCell(row.invoicedOrders),
  },
  {
    key: "invoicedOrdersRevenue",
    label: "Invoiced orders revenue",
    defaultVisible: true,
    value: (row) => numberCell(row.invoicedOrdersRevenue),
  },
  {
    key: "avgOrderSize",
    label: "Avg. Order size",
    defaultVisible: true,
    value: (row) => numberCell(row.avgOrderSize),
  },
  {
    key: "referenceFrom",
    label: "Reference date from",
    defaultVisible: true,
    value: (row) => dateCell(row.referenceFrom),
  },
  {
    key: "referenceTo",
    label: "Reference date u/i",
    defaultVisible: true,
    value: (row) => dateCell(row.referenceTo),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: true,
    value: (row) => textCell(row.city),
  },
  {
    key: "postalCode",
    label: "Postal code",
    defaultVisible: true,
    value: (row) => textCell(row.postalCode),
  },
  {
    key: "searchCode2",
    label: "Searchcode 2",
    defaultVisible: true,
    value: (row) => textCell(row.searchCode2),
  },
  {
    key: "searchCode1",
    label: "Searchcode 1",
    defaultVisible: true,
    value: (row) => textCell(row.searchCode1),
  },
  {
    key: "customerCode",
    label: "Customer code",
    defaultVisible: true,
    value: (row) => numberCell(row.customerCode),
  },
  {
    key: "regionNumber",
    label: "Region number",
    defaultVisible: false,
    // `0` on every reference row, and nothing here numbers a region.
    value: () => null,
  },
  {
    key: "region",
    label: "Region",
    defaultVisible: true,
    value: (row) => textCell(row.region),
  },
  {
    key: "invoiceEmailEnabled",
    label: "Email to",
    defaultVisible: true,
    value: (row) => yesNoCell(row.invoiceEmailEnabled),
  },
  {
    key: "invoiceEmailTo",
    label: "To email",
    defaultVisible: true,
    value: (row) => textCell(row.invoiceEmailTo),
  },
  {
    key: "vatNumber",
    label: "VAT number",
    defaultVisible: true,
    value: (row) => textCell(row.vatNumber),
  },
];
