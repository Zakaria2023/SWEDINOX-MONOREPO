import {
  Building2,
  ContactRound,
  Factory,
  LucideIcon,
  MapPin,
  MessageSquareWarning,
  PackageCheck,
  ShoppingCart,
  Truck,
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

/** The dashboard overview — the one nav entry that is not inside a group. */
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

/** The whole back-office menu: one group per area of the business. */
export const NAV_GROUPS: NavGroup[] = [
  {
    key: "customers",
    label: "Customers",
    icon: Users,
    items: [
      { label: "Quotes", href: "/quotes" },
      { label: "Orders", href: "/orders" },
      { label: "Return Orders", href: "/return-orders" },
      { label: "Return Lines", href: "/return-lines" },
      { label: "Counter Orders", href: "/counter-orders" },
      { label: "Customer Overview", href: "/customer-overview" },
      { label: "Remarks per Company", href: "/remarks-per-company" },
      { label: "Addresses", href: "/addresses" },
      { label: "Contracts per Customer", href: "/contracts-per-customer" },
      {
        label: "Customer/Prospect Contact",
        href: "/contact-persons-customers-and-prospects",
      },
      { label: "Customers and Prospects", href: "/customers-and-prospects" },
      { label: "Visit Schedule", href: "/visit-schedule" },
      { label: "Change Visit Schedule", href: "/change-visit-schedule" },
      { label: "To Visit / Call", href: "/to-visit-call" },
      { label: "Customer Revenue", href: "/customer-revenue" },
      {
        label: "Customer Revenue per Revenue Group",
        href: "/customer-revenue-per-revenue-group",
      },
      {
        label: "Customer Revenue per Product Group",
        href: "/customer-revenue-per-product-group",
      },
      {
        label: "Customer Revenue per Group (Split)",
        href: "/customer-revenue-per-revenue-group-split",
      },
      {
        label: "Customer Revenue, Sales & Visits",
        href: "/customer-revenue-sales-and-visits",
      },
      { label: "Unblocked Orders", href: "/unblocked-orders" },
      { label: "Follow-ups", href: "/follow-ups" },
    ],
  },
  {
    key: "company",
    label: "Company",
    icon: Building2,
    items: [
      { label: "Companies", href: "/companies" },
      { label: "Communication Settings", href: "/communication-settings" },
      { label: "Address Distances", href: "/address-distances" },
      { label: "Visit Reports", href: "/visit-reports" },
      { label: "Visits Made", href: "/visits-made" },
      { label: "Text Categories", href: "/text-categories" },
      { label: "Texts", href: "/texts" },
      { label: "Industries", href: "/industries" },
      { label: "Inactive Companies", href: "/inactive-companies" },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    icon: ContactRound,
    items: [
      { label: "Orders and Quotes", href: "/orders-and-quotes" },
      {
        label: "Order Lines Capacity Overflow",
        href: "/order-lines-capacity-overflow",
      },
      {
        label: "SFN Statistics Product-Market",
        href: "/sfn-statistics-product-market",
      },
      { label: "Contracts", href: "/contracts" },
      { label: "Contract Groups", href: "/contract-groups" },
      { label: "Invoices", href: "/invoices" },
      { label: "Deliveries", href: "/deliveries" },
      { label: "Blocked Deliveries", href: "/blocked-deliveries" },
      { label: "Deliveries to Arrange", href: "/deliveries-to-arrange" },
      { label: "Invoice Lines", href: "/invoice-lines" },
      { label: "Quote Lines", href: "/quote-lines" },
      { label: "Order Lines", href: "/order-lines" },
      { label: "Product Prices", href: "/product-prices" },
      { label: "Net Prices", href: "/net-prices" },
      {
        label: "Option Prices per Product",
        href: "/option-prices-per-product",
      },
      { label: "Options", href: "/options" },
      {
        label: "Order Lines Still to be Called",
        href: "/order-lines-still-to-be-called",
      },
      {
        label: "Orders Still to be Called",
        href: "/orders-still-to-be-called",
      },
      { label: "Charges", href: "/charges" },
      { label: "Journal Entries", href: "/journal-entries" },
      { label: "Trial Balance", href: "/trial-balance" },
      { label: "Payments", href: "/payments" },
      { label: "Debtor Ageing", href: "/debtor-ageing" },
      { label: "Payment Reminders", href: "/payment-reminders" },
      {
        label: "Cost Price for Invoices to be Sent",
        href: "/cost-price-invoices-to-be-sent",
      },
      {
        label: "CD-deliveries in Progress",
        href: "/cd-deliveries-in-progress",
      },
      {
        label: "Control: Stock Increase Ext. Processing",
        href: "/control-stock-increase-external-processing",
      },
      {
        label: "Control: Revaluation of Stock (FSP)",
        href: "/control-stock-revaluation-fsp",
      },
      {
        label: "Control: Sawing Waste",
        href: "/control-sawing-waste",
      },
      { label: "CBS Documentation", href: "/cbs-documentation" },
      {
        label: "Financially Blocked Quotes & Orders",
        href: "/financially-blocked",
      },
      {
        label: "Credit Information Customers",
        href: "/credit-information-customers",
      },
      {
        label: "Purchase Invoices to be Received",
        href: "/purchase-invoices-to-be-received",
      },
      {
        label: "Purchase Orders to be Received",
        href: "/purchase-orders-to-be-received",
      },
      {
        label: "Revenue per Revenue Group",
        href: "/revenue-per-revenue-group",
      },
      {
        label: "Revenue per Revenue Group (Period)",
        href: "/revenue-per-revenue-group-period",
      },
      { label: "Revenue per Product", href: "/revenue-per-product" },
      {
        label: "Purchases & Sales per Revenue Group",
        href: "/purchases-and-sales-per-revenue-group",
      },
      { label: "Revenue w.r.t. Budget", href: "/revenue-vs-budget" },
    ],
  },
  {
    key: "supplier",
    label: "Supplier",
    icon: Truck,
    items: [
      { label: "Suppliers", href: "/suppliers" },
      { label: "Supplier Revenue", href: "/supplier-revenue" },
      {
        label: "Supplier Revenue per Revenue Group",
        href: "/supplier-revenue-per-revenue-group",
      },
      { label: "Contracts per Supplier", href: "/contracts-per-supplier" },
      {
        label: "Contact Persons Suppliers",
        href: "/contact-persons-suppliers",
      },
    ],
  },
  {
    key: "purchases",
    label: "Purchases",
    icon: ShoppingCart,
    items: [
      { label: "Order Advice", href: "/order-advice" },
      { label: "StockOn Advice", href: "/stockon-advice" },
      {
        label: "Sold Products Not Advised",
        href: "/sold-products-not-advised",
      },
      { label: "Purchase Quotes", href: "/purchase-quotes" },
      { label: "Purchase Requests", href: "/purchase-requests" },
      { label: "Purchase Orders", href: "/purchase-orders" },
      {
        label: "Purchase Orders and Quotes",
        href: "/purchase-orders-and-quotes",
      },
      { label: "Purchase Return Orders", href: "/purchase-return-orders" },
      { label: "Purchase Invoices", href: "/purchase-invoices" },
      { label: "Purchase Invoice Line", href: "/purchase-invoice-line" },
      { label: "Purchase Lines", href: "/purchase-lines" },
      { label: "Purchase Quotes Overview", href: "/purchase-quotes-overview" },
      { label: "Purchase Receivals", href: "/purchase-receivals" },
      { label: "Receipts", href: "/receipts" },
      { label: "Purchase Results", href: "/purchase-results" },
      {
        label: "Import Purchase Invoices",
        href: "/import-purchase-invoices",
      },
    ],
  },
  {
    key: "warehouse",
    label: "Warehouse",
    icon: Warehouse,
    items: [
      { label: "Warehouses", href: "/warehouses" },
      { label: "Warehouse Sub Sections", href: "/warehouse-sub-sections" },
    ],
  },
  {
    key: "locations",
    label: "Locations",
    icon: MapPin,
    items: [{ label: "Locations", href: "/locations" }],
  },
  {
    key: "logistics",
    label: "Logistics",
    icon: Factory,
    items: [
      { label: "Deviations in Count Lists", href: "/count-list-deviations" },
      { label: "Product Groups", href: "/product-groups" },
      { label: "Products", href: "/products" },
      { label: "Warehouse Work Orders", href: "/warehouse-work-orders" },
      { label: "Production Work Orders", href: "/production-workorders" },
      {
        label: "Warehouse- and Production Work Orders",
        href: "/warehouse-and-production-workorders",
      },
      { label: "Production Batches", href: "/production-batches" },
      { label: "Transport Work Orders", href: "/transport-workorders" },
      { label: "Trip Data", href: "/trip-data" },
      { label: "Customer Stock", href: "/customer-stock" },
      { label: "Freight Movement", href: "/freight-movements" },
      { label: "Freight Flow (SFN)", href: "/freight-flow" },
      { label: "Pick Statistic", href: "/pick-statistics" },
      { label: "Machines", href: "/machines" },
      { label: "Sawing Layouts", href: "/sawing-layouts" },
      { label: "Warehouse Capacity", href: "/warehouse-capacity" },
      { label: "Production Capacity", href: "/production-capacity" },
      {
        label: "Production Capacity Details",
        href: "/production-capacity-details",
      },
      { label: "Capacity Checks", href: "/capacity-checks" },
      { label: "Time Registration", href: "/time-registration" },
      { label: "(Re)optimize", href: "/reoptimize" },
      { label: "Nesting", href: "/nesting" },
      {
        label: "Transport Status Adjustments",
        href: "/transport-status-adjustments",
      },
    ],
  },
  {
    key: "batch-registration",
    label: "Batch Registration",
    icon: PackageCheck,
    items: [
      { label: "Batches", href: "/batches" },
      { label: "Certificates Received", href: "/certificates-received" },
      {
        label: "Certificates to be Linked",
        href: "/certificates-to-be-linked",
      },
      { label: "Sending Certificates", href: "/sending-certificates" },
      {
        label: "Deliveries from the Missing Batch",
        href: "/deliveries-from-missing-batch",
      },
    ],
  },
  {
    key: "others",
    label: "Others",
    icon: MessageSquareWarning,
    items: [
      { label: "Complaints", href: "/complaints" },
      { label: "Complaint Lines", href: "/complaint-lines" },
      { label: "Balanced Scorecard", href: "/balanced-scorecard" },
      { label: "Transport by Region", href: "/transport-by-region" },
      {
        label: "SigmaNest Blocked Orders",
        href: "/sigmanest-blocked-orders",
      },
    ],
  },
];
