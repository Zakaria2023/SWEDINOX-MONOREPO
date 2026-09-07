import {
  BadgeCheck,
  Building2,
  ClipboardList,
  ContactRound,
  Landmark,
  LayoutList,
  LucideIcon,
  MessageSquareWarning,
  PackageCheck,
  Plus,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** The dashboard overview — the one nav entry that is not inside a tab. */
export const DASHBOARD_HREF = "/";

export type NavItem = {
  label: string;
  href: string;
};

export type NavGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

/**
 * One of the three things the menu is for.
 *
 * The reference system splits its navigation the same way: a `Nieuw` menu that
 * starts a new record, an `Overviews` tree that lists what already exists, and
 * a small toolbar for the shop floor's own work. Those are three different
 * questions — "make one", "find one", "what am I doing today" — and answering
 * them from one flat list of 130 links is what made the old menu unusable.
 *
 * A flat tab shows every entry at once; a grouped one collapses, because the
 * overviews alone run past a hundred.
 */
export type NavTab =
  | {
      key: string;
      label: string;
      icon: LucideIcon;
      kind: "flat";
      items: NavItem[];
    }
  | {
      key: string;
      label: string;
      icon: LucideIcon;
      kind: "grouped";
      groups: NavGroup[];
    };

/** The reference system's `Nieuw` menu — one entry per kind of record. */
const ACTION_ITEMS: NavItem[] = [
  { label: "Company", href: "/companies/add" },
  { label: "Complaint", href: "/complaints/new" },
  { label: "Contract", href: "/contracts/add" },
  { label: "Counter order", href: "/counter-orders/add" },
  { label: "Invoice", href: "/invoices/add" },
  { label: "Location", href: "/locations/add" },
  { label: "Machine", href: "/machines/add" },
  { label: "Order", href: "/orders/new" },
  { label: "Product", href: "/products/new" },
  { label: "Product group", href: "/product-groups/add" },
  { label: "Purchase invoice", href: "/purchase-invoices/add" },
  { label: "Purchase order", href: "/purchase-orders/new" },
  { label: "Purchase quote", href: "/purchase-quotes/new" },
  { label: "Purchase request", href: "/purchase-requests/new" },
  { label: "Purchase return order", href: "/purchase-return-orders/new" },
  { label: "Quote", href: "/quotes/new" },
  { label: "Return order", href: "/return-orders/new" },
  { label: "Visit report", href: "/visit-reports/add" },
  { label: "Warehouse section", href: "/warehouses/add" },
  { label: "Warehouse subsection", href: "/warehouse-sub-sections/add" },
];

/** The reference system's `Overviews` tree, group for group. */
const VIEW_GROUPS: NavGroup[] = [
  {
    key: "purchase",
    label: "Purchase",
    icon: ShoppingCart,
    items: [
      { label: "Order advice", href: "/order-advice" },
      {
        label: "Sold products not on the order recommendation",
        href: "/sold-products-not-advised",
      },
      { label: "Purchase lines", href: "/purchase-lines" },
      { label: "Purchase quotes", href: "/purchase-quotes" },
      { label: "Purchase results", href: "/purchase-results" },
      { label: "Purchase invoice line", href: "/purchase-invoice-line" },
      { label: "Purchase invoices", href: "/purchase-invoices" },
      { label: "Net prices", href: "/net-prices" },
      { label: "StockOn advice", href: "/stockon-advice" },
      { label: "Purchase receivals", href: "/purchase-receivals" },
      {
        label: "Purchase orders and quotes",
        href: "/purchase-orders-and-quotes",
      },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    icon: Users,
    items: [
      { label: "Visit schedule", href: "/visit-schedule" },
      { label: "Change visit schedule", href: "/change-visit-schedule" },
      { label: "To visit/call", href: "/to-visit-call" },
      { label: "Customer overview", href: "/customer-overview" },
      { label: "Customers and Prospects", href: "/customers-and-prospects" },
      {
        label: "Contact persons Customers and Prospects",
        href: "/contact-persons-customers-and-prospects",
      },
      { label: "Addresses", href: "/addresses" },
      { label: "Remarks per company", href: "/remarks-per-company" },
      {
        label: "Customer revenue per product group",
        href: "/customer-revenue-per-product-group",
      },
      {
        label: "Customer revenue per revenue group",
        href: "/customer-revenue-per-revenue-group",
      },
      {
        label: "Customer revenue per revenue group with split order types",
        href: "/customer-revenue-per-revenue-group-split",
      },
      { label: "Unblocked orders", href: "/unblocked-orders" },
      { label: "Customer revenue", href: "/customer-revenue" },
      {
        label: "Contracts per Customer / Prospect",
        href: "/contracts-per-customer",
      },
      {
        label: "Customerrevenue, -sales and -visits",
        href: "/customer-revenue-sales-and-visits",
      },
    ],
  },
  {
    key: "companies",
    label: "Companies",
    icon: Building2,
    items: [
      { label: "Address distances", href: "/address-distances" },
      { label: "Visits made", href: "/visits-made" },
      { label: "Visit reports", href: "/visit-reports" },
      { label: "Inactive companies", href: "/inactive-companies" },
      { label: "Texts", href: "/texts" },
      { label: "Communication settings", href: "/communication-settings" },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    icon: Landmark,
    items: [
      { label: "Journal entries", href: "/journal-entries" },
      {
        label: "Cost price for selling of invoices to be sent",
        href: "/cost-price-invoices-to-be-sent",
      },
      {
        label: "Purchase invoices to be received",
        href: "/purchase-invoices-to-be-received",
      },
      {
        label: "Purchase orders to be received",
        href: "/purchase-orders-to-be-received",
      },
      {
        label: "Revenue per revenue group (month)",
        href: "/revenue-per-revenue-group",
      },
      {
        label: "Revenue per revenue group (period)",
        href: "/revenue-per-revenue-group-period",
      },
      {
        label: "Purchases and sales per revenue group",
        href: "/purchases-and-sales-per-revenue-group",
      },
      {
        label: "Credit information customers",
        href: "/credit-information-customers",
      },
      {
        label: "Financially blocked quotes and orders",
        href: "/financially-blocked",
      },
      {
        label: "CD-deliveries in progress",
        href: "/cd-deliveries-in-progress",
      },
      {
        label: "Control Stock increase due to external processing",
        href: "/control-stock-increase-external-processing",
      },
      {
        label: "Control Revaluation of stock due to FSP-changes",
        href: "/control-stock-revaluation-fsp",
      },
      { label: "Control sawing waste", href: "/control-sawing-waste" },
      { label: "CBS Documentatie", href: "/cbs-documentation" },
    ],
  },
  {
    key: "suppliers",
    label: "Suppliers",
    icon: ContactRound,
    items: [
      {
        label: "Supplier revenue per revenue group",
        href: "/supplier-revenue-per-revenue-group",
      },
      { label: "Supplier revenue", href: "/supplier-revenue" },
      { label: "Contracts per supplier", href: "/contracts-per-supplier" },
      { label: "Suppliers", href: "/suppliers" },
      {
        label: "Contact persons suppliers",
        href: "/contact-persons-suppliers",
      },
    ],
  },
  {
    key: "logistics",
    label: "Logistics",
    icon: Warehouse,
    items: [
      { label: "Deviations in count lists", href: "/count-list-deviations" },
      { label: "Products", href: "/products" },
      {
        label: "Warehouse- and production workorders",
        href: "/warehouse-and-production-workorders",
      },
      { label: "Receipts", href: "/receipts" },
      { label: "Warehouse workorders", href: "/warehouse-work-orders" },
      { label: "Production workorders", href: "/production-workorders" },
      { label: "Production batches", href: "/production-batches" },
      { label: "Transport workorders", href: "/transport-workorders" },
      { label: "Trip data", href: "/trip-data" },
      { label: "Reservations", href: "/reservations" },
      { label: "Stock", href: "/stock" },
      { label: "Stock on location", href: "/stock-on-location" },
      { label: "Customer stock on location", href: "/customer-stock" },
      { label: "Locations", href: "/locations" },
      { label: "Stock history", href: "/stock-history" },
      { label: "Stock mutations", href: "/stock-movements" },
      { label: "Freight movement", href: "/freight-movements" },
      { label: "Revenue per product", href: "/revenue-per-product" },
      { label: "Freight flow (SFN)", href: "/freight-flow" },
      { label: "Pick statistic", href: "/pick-statistics" },
      { label: "Machines", href: "/machines" },
      { label: "Blocked deliveries", href: "/blocked-deliveries" },
      {
        label: "Deliveries to be arranged without stock reservation",
        href: "/deliveries-to-arrange",
      },
      { label: "Sawing layouts", href: "/sawing-layouts" },
      { label: "Warehouse capacity", href: "/warehouse-capacity" },
      { label: "Production capacity", href: "/production-capacity" },
      {
        label: "Production capacity details",
        href: "/production-capacity-details",
      },
      { label: "Capacity checks", href: "/capacity-checks" },
      { label: "Time registration", href: "/time-registration" },
      { label: "(Re)optimize", href: "/reoptimize" },
      { label: "Nesten", href: "/nesting" },
      {
        label: "Transport status adjustments",
        href: "/transport-status-adjustments",
      },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    icon: PackageCheck,
    items: [
      { label: "Orders and Quotes", href: "/orders-and-quotes" },
      { label: "Order lines", href: "/order-lines" },
      {
        label: "Order lines capacity overflow",
        href: "/order-lines-capacity-overflow",
      },
      { label: "Options", href: "/options" },
      {
        label: "Order lines still to be called",
        href: "/order-lines-still-to-be-called",
      },
      {
        label: "Orders still to be called",
        href: "/orders-still-to-be-called",
      },
      { label: "Quote lines", href: "/quote-lines" },
      { label: "Invoice lines", href: "/invoice-lines" },
      { label: "Deliveries", href: "/deliveries" },
      { label: "Charges", href: "/charges" },
      { label: "Contracts", href: "/contracts" },
      { label: "Contractgroups", href: "/contract-groups" },
      { label: "Product prices", href: "/product-prices" },
      {
        label: "Option prices per product",
        href: "/option-prices-per-product",
      },
      { label: "Net prices", href: "/net-prices" },
      {
        label: "SFN statistics Product-Market combinations",
        href: "/sfn-statistics-product-market",
      },
      { label: "Revenue w.r.t. Budget", href: "/revenue-vs-budget" },
      { label: "Invoices", href: "/invoices" },
      { label: "Return lines", href: "/return-lines" },
    ],
  },
  {
    key: "batch-registration",
    label: "Batch registration",
    icon: BadgeCheck,
    items: [
      { label: "Certificates received", href: "/certificates-received" },
      { label: "Sending certificates", href: "/sending-certificates" },
      {
        label: "Deliveries from the missing batch",
        href: "/deliveries-from-missing-batch",
      },
      { label: "Batches", href: "/batches" },
      {
        label: "Certificates to be linked",
        href: "/certificates-to-be-linked",
      },
    ],
  },
  {
    key: "other",
    label: "Other",
    icon: MessageSquareWarning,
    items: [
      { label: "Complaints", href: "/complaints" },
      { label: "Complaint lines", href: "/complaint-lines" },
      { label: "Balanced Scorecard", href: "/balanced-scorecard" },
      { label: "Transport by region", href: "/transport-by-region" },
      {
        label: "SigmaNest geblokkeerde orders",
        href: "/sigmanest-blocked-orders",
      },
    ],
  },
];

/** The shop floor's own toolbar: the work in hand and what is going out. */
const WORK_ITEMS: NavItem[] = [
  { label: "Warehouse workorders", href: "/warehouse-work-orders" },
  { label: "Production workorders", href: "/production-workorders" },
  {
    label: "Warehouse- and production workorders",
    href: "/warehouse-and-production-workorders",
  },
  { label: "Transport workorders", href: "/transport-workorders" },
  { label: "Deliveries", href: "/deliveries" },
];

export const NAV_TABS: NavTab[] = [
  {
    key: "actions",
    label: "Actions",
    icon: Plus,
    kind: "flat",
    items: ACTION_ITEMS,
  },
  {
    key: "views",
    label: "Views",
    icon: LayoutList,
    kind: "grouped",
    groups: VIEW_GROUPS,
  },
  {
    key: "work",
    label: "Work orders",
    icon: ClipboardList,
    kind: "flat",
    items: WORK_ITEMS,
  },
];

/** Every link in the menu, whichever tab it sits under — used by the search. */
export const NAV_ITEMS: (NavItem & { tabKey: string; groupLabel: string })[] =
  NAV_TABS.flatMap((tab) =>
    tab.kind === "flat"
      ? tab.items.map((item) => ({
          ...item,
          tabKey: tab.key,
          groupLabel: tab.label,
        }))
      : tab.groups.flatMap((group) =>
          group.items.map((item) => ({
            ...item,
            tabKey: tab.key,
            groupLabel: group.label,
          })),
        ),
  );
