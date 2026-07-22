"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/shadcn/sidebar";
import { cn } from "@/lib/helpers";
import {
  Building2,
  ChevronRight,
  ContactRound,
  Factory,
  MapPin,
  MessageSquareWarning,
  Search,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  label: string;
  href: string;
};

type NavGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
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
      { label: "Text Categories", href: "/text-categories" },
      { label: "Texts", href: "/texts" },
      { label: "Inactive Companies", href: "/inactive-companies" },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    icon: ContactRound,
    items: [
      { label: "Contracts", href: "/contracts" },
      { label: "Contract Groups", href: "/contract-groups" },
      { label: "Invoices", href: "/invoices" },
      { label: "Deliveries", href: "/deliveries" },
      { label: "Blocked Deliveries", href: "/blocked-deliveries" },
      { label: "Deliveries to Arrange", href: "/deliveries-to-arrange" },
      { label: "Invoice Lines", href: "/invoice-lines" },
      { label: "Order Lines", href: "/order-lines" },
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
      { label: "Production Batches", href: "/production-batches" },
      { label: "Transport Work Orders", href: "/transport-workorders" },
      { label: "Trip Data", href: "/trip-data" },
      { label: "Reservations", href: "/reservations" },
      { label: "Stock", href: "/stock" },
      { label: "Stock Movements", href: "/stock-movements" },
      { label: "Stock on Location", href: "/stock-on-location" },
      { label: "Customer Stock", href: "/customer-stock" },
      { label: "Stock History", href: "/stock-history" },
      { label: "Freight Movement", href: "/freight-movements" },
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
    key: "others",
    label: "Others",
    icon: MessageSquareWarning,
    items: [{ label: "Complaints", href: "/complaints" }],
  },
];

// A route matches a nav item when it is the exact path or a nested path beneath
// it — never a sibling that merely shares the same prefix (so /stock stays
// distinct from /stock-movements).
const isPathActive = (href: string, pathname: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export const AppSidebar = () => {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const chevronClass = (isExpanded: boolean) =>
    cn("ms-auto transition-transform", { "rotate-90": isExpanded });

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      initial[group.key] = group.items.some((item) =>
        isPathActive(item.href, pathname),
      );
    }
    return initial;
  });

  // Auto-open the group that owns the current page on navigation, while still
  // letting the user collapse it manually afterwards.
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of NAV_GROUPS) {
        if (group.items.some((item) => isPathActive(item.href, pathname))) {
          next[group.key] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const searchResults = useMemo(() => {
    if (!trimmedQuery) {
      return [];
    }
    return NAV_GROUPS.flatMap((group) =>
      group.items
        .filter((item) => item.label.toLowerCase().includes(trimmedQuery))
        .map((item) => ({ ...item, groupLabel: group.label })),
    );
  }, [trimmedQuery]);

  return (
    <Sidebar>
      <SidebarHeader className="gap-3 px-4 py-5">
        <span className="text-lg font-semibold tracking-tight">Swedinox</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <SidebarInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search…"
            aria-label="Search navigation"
            className="ps-8"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {isSearching ? "Results" : "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {isSearching && searchResults.length > 0 && (
              <SidebarMenu>
                {searchResults.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isPathActive(item.href, pathname)}
                    >
                      <span>{item.label}</span>
                      <span className="ms-auto text-xs text-sidebar-foreground/50">
                        {item.groupLabel}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}

            {isSearching && searchResults.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                No results for “{query.trim()}”
              </p>
            )}

            {!isSearching && (
              <SidebarMenu>
                {NAV_GROUPS.map((group) => {
                  const Icon = group.icon;
                  const isExpanded = openGroups[group.key];
                  return (
                    <SidebarMenuItem key={group.key}>
                      <SidebarMenuButton
                        aria-expanded={isExpanded}
                        onClick={() => toggleGroup(group.key)}
                      >
                        <Icon />
                        <span>{group.label}</span>
                        <ChevronRight className={chevronClass(isExpanded)} />
                      </SidebarMenuButton>
                      {isExpanded && (
                        <SidebarMenuSub>
                          {group.items.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton
                                render={<Link href={item.href} />}
                                isActive={isPathActive(item.href, pathname)}
                              >
                                <span>{item.label}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
