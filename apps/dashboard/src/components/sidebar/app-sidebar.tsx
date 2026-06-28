"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
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
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export const AppSidebar = () => {
  const pathname = usePathname();

  const chevronClass = (isExpanded: boolean) =>
    cn("ms-auto transition-transform", {
      "rotate-90": isExpanded,
    });

  const isCustomersActive =
    pathname.startsWith("/addresses") ||
    pathname.startsWith("/contracts-per-customer") ||
    pathname.startsWith("/contact-persons-customers-and-prospects") ||
    pathname.startsWith("/orders");
  const isCompanyActive =
    pathname.startsWith("/companies") ||
    pathname.startsWith("/communication-settings") ||
    pathname.startsWith("/address-distances") ||
    pathname.startsWith("/visit-reports") ||
    pathname.startsWith("/text-categories") ||
    pathname.startsWith("/texts");
  const isSalesActive =
    pathname === "/contracts" ||
    pathname.startsWith("/contracts/") ||
    pathname.startsWith("/contract-groups") ||
    pathname.startsWith("/invoices");
  const isSupplierActive =
    pathname.startsWith("/contracts-per-supplier") ||
    pathname.startsWith("/contact-persons-suppliers");
  const isPurchasesActive =
    pathname.startsWith("/purchase-orders") ||
    pathname.startsWith("/purchase-invoices");
  const isWarehouseActive =
    pathname.startsWith("/warehouses") ||
    pathname.startsWith("/warehouse-sub-sections");
  const isLocationsActive = pathname.startsWith("/locations");
  const isLogisticsActive =
    pathname.startsWith("/machines") ||
    pathname.startsWith("/product-groups") ||
    pathname.startsWith("/products");
  const isOthersActive = pathname.startsWith("/complaints");

  const [isCustomersOpen, setIsCustomersOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [isPurchasesOpen, setIsPurchasesOpen] = useState(false);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);
  const [isLocationsOpen, setIsLocationsOpen] = useState(false);
  const [isLogisticsOpen, setIsLogisticsOpen] = useState(false);
  const [isOthersOpen, setIsOthersOpen] = useState(false);

  const isCustomersExpanded = isCustomersOpen || isCustomersActive;
  const isCompanyExpanded = isCompanyOpen || isCompanyActive;
  const isSalesExpanded = isSalesOpen || isSalesActive;
  const isSupplierExpanded = isSupplierOpen || isSupplierActive;
  const isPurchasesExpanded = isPurchasesOpen || isPurchasesActive;
  const isWarehouseExpanded = isWarehouseOpen || isWarehouseActive;
  const isLocationsExpanded = isLocationsOpen || isLocationsActive;
  const isLogisticsExpanded = isLogisticsOpen || isLogisticsActive;
  const isOthersExpanded = isOthersOpen || isOthersActive;

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5">
        <span className="text-lg font-semibold tracking-tight">Swedinox</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-expanded={isCustomersExpanded}
                  onClick={() => setIsCustomersOpen((open) => !open)}
                >
                  <Users />
                  <span>Customers</span>
                  <ChevronRight className={chevronClass(isCustomersExpanded)} />
                </SidebarMenuButton>
                {isCustomersExpanded && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/orders" />}
                        isActive={pathname.startsWith("/orders")}
                      >
                        <span>Orders</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/addresses" />}
                        isActive={pathname.startsWith("/addresses")}
                      >
                        <span>Addresses</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/contracts-per-customer" />}
                        isActive={pathname.startsWith(
                          "/contracts-per-customer",
                        )}
                      >
                        <span>Customer/Prospect Contracts</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={
                          <Link href="/contact-persons-customers-and-prospects" />
                        }
                        isActive={pathname.startsWith(
                          "/contact-persons-customers-and-prospects",
                        )}
                      >
                        <span>Customer/Prospect Contact</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-expanded={isCompanyExpanded}
                  onClick={() => setIsCompanyOpen((open) => !open)}
                >
                  <Building2 />
                  <span>Company</span>
                  <ChevronRight className={chevronClass(isCompanyExpanded)} />
                </SidebarMenuButton>
                {isCompanyExpanded && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/companies" />}
                        isActive={
                          pathname === "/companies" ||
                          pathname.startsWith("/companies/")
                        }
                      >
                        <span>Companies</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/communication-settings" />}
                        isActive={pathname.startsWith(
                          "/communication-settings",
                        )}
                      >
                        <span>Communication Settings</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/address-distances" />}
                        isActive={pathname.startsWith("/address-distances")}
                      >
                        <span>Address Distances</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/visit-reports" />}
                        isActive={pathname.startsWith("/visit-reports")}
                      >
                        <span>Visit Reports</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/text-categories" />}
                        isActive={pathname.startsWith("/text-categories")}
                      >
                        <span>Text Categories</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/texts" />}
                        isActive={pathname.startsWith("/texts")}
                      >
                        <span>Texts</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-expanded={isSalesExpanded}
                  onClick={() => setIsSalesOpen((open) => !open)}
                >
                  <ContactRound />
                  <span>Sales</span>
                  <ChevronRight className={chevronClass(isSalesExpanded)} />
                </SidebarMenuButton>
                {isSalesExpanded && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/contracts" />}
                        isActive={pathname.startsWith("/contracts")}
                      >
                        <span>Contracts</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/contract-groups" />}
                        isActive={pathname.startsWith("/contract-groups")}
                      >
                        <span>Contract Groups</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/invoices" />}
                        isActive={pathname.startsWith("/invoices")}
                      >
                        <span>Invoices</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-expanded={isSupplierExpanded}
                  onClick={() => setIsSupplierOpen((open) => !open)}
                >
                  <Truck />
                  <span>Supplier</span>
                  <ChevronRight className={chevronClass(isSupplierExpanded)} />
                </SidebarMenuButton>
                {isSupplierExpanded && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/contracts-per-supplier" />}
                        isActive={pathname.startsWith(
                          "/contracts-per-supplier",
                        )}
                      >
                        <span>Contracts per Supplier</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/contact-persons-suppliers" />}
                        isActive={pathname.startsWith(
                          "/contact-persons-suppliers",
                        )}
                      >
                        <span>Contact Persons Suppliers</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-expanded={isPurchasesExpanded}
                  onClick={() => setIsPurchasesOpen((open) => !open)}
                >
                  <ShoppingCart />
                  <span>Purchases</span>
                  <ChevronRight className={chevronClass(isPurchasesExpanded)} />
                </SidebarMenuButton>
                {isPurchasesExpanded && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/purchase-orders" />}
                        isActive={pathname.startsWith("/purchase-orders")}
                      >
                        <span>Purchase Orders</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/purchase-invoices" />}
                        isActive={pathname.startsWith("/purchase-invoices")}
                      >
                        <span>Purchase Invoices</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-expanded={isWarehouseExpanded}
                  onClick={() => setIsWarehouseOpen((open) => !open)}
                >
                  <Warehouse />
                  <span>Warehouse</span>
                  <ChevronRight className={chevronClass(isWarehouseExpanded)} />
                </SidebarMenuButton>
                {isWarehouseExpanded && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/warehouses" />}
                        isActive={
                          pathname === "/warehouses" ||
                          pathname.startsWith("/warehouses/")
                        }
                      >
                        <span>Warehouses</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/warehouse-sub-sections" />}
                        isActive={pathname.startsWith(
                          "/warehouse-sub-sections",
                        )}
                      >
                        <span>Warehouse Sub Sections</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-expanded={isLocationsExpanded}
                  onClick={() => setIsLocationsOpen((open) => !open)}
                >
                  <MapPin />
                  <span>Locations</span>
                  <ChevronRight className={chevronClass(isLocationsExpanded)} />
                </SidebarMenuButton>
                {isLocationsExpanded && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/locations" />}
                        isActive={pathname.startsWith("/locations")}
                      >
                        <span>Locations</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-expanded={isLogisticsExpanded}
                  onClick={() => setIsLogisticsOpen((open) => !open)}
                >
                  <Factory />
                  <span>Logistics</span>
                  <ChevronRight className={chevronClass(isLogisticsExpanded)} />
                </SidebarMenuButton>
                {isLogisticsExpanded && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                      <SidebarMenuSubButton
                        render={<Link href="/machines" />}
                        isActive={pathname.startsWith("/machines")}
                      >
                        <span>Machines</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        render={<Link href="/product-groups" />}
                        isActive={pathname.startsWith("/product-groups")}
                      >
                        <span>Product Groups</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/products" />}
                        isActive={pathname.startsWith("/products")}
                      >
                        <span>Products</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-expanded={isOthersExpanded}
                  onClick={() => setIsOthersOpen((open) => !open)}
                >
                  <MessageSquareWarning />
                  <span>Others</span>
                  <ChevronRight className={chevronClass(isOthersExpanded)} />
                </SidebarMenuButton>
                {isOthersExpanded && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/complaints" />}
                        isActive={pathname.startsWith("/complaints")}
                      >
                        <span>Complaints</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
