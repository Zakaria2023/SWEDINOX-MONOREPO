"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  ChevronRight,
  ContactRound,
  Truck,
  Users,
} from "lucide-react";
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

export const AppSidebar = () => {
  const pathname = usePathname();

  const chevronClass = (isExpanded: boolean) =>
    cn("ms-auto transition-transform", {
      "rotate-90": isExpanded,
    });

  const isCustomersActive =
    pathname.startsWith("/addresses") ||
    pathname.startsWith("/contracts-per-customer") ||
    pathname.startsWith("/contact-persons-customers-and-prospects");
  const isCompanyActive =
    pathname.startsWith("/companies") ||
    pathname.startsWith("/communication-settings");
  const isSalesActive =
    pathname === "/contracts" ||
    pathname.startsWith("/contracts/") ||
    pathname.startsWith("/contract-groups");
  const isSupplierActive =
    pathname.startsWith("/contracts-per-supplier") ||
    pathname.startsWith("/contact-persons-suppliers");

  const [isCustomersOpen, setIsCustomersOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);

  const isCustomersExpanded = isCustomersOpen || isCustomersActive;
  const isCompanyExpanded = isCompanyOpen || isCompanyActive;
  const isSalesExpanded = isSalesOpen || isSalesActive;
  const isSupplierExpanded = isSupplierOpen || isSupplierActive;

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5">
        <span className="text-lg font-semibold tracking-tight">
          Swedinox
        </span>
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
                        render={<Link href="/addresses" />}
                        isActive={pathname.startsWith("/addresses")}
                      >
                        <span>Addresses</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/contracts-per-customer" />}
                        isActive={pathname.startsWith("/contracts-per-customer")}
                      >
                        <span>Contracts per Customer</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/contact-persons-customers-and-prospects" />}
                        isActive={pathname.startsWith("/contact-persons-customers-and-prospects")}
                      >
                        <span>Contact Persons Customers and Prospects</span>
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
                        isActive={pathname.startsWith("/communication-settings")}
                      >
                        <span>Communication Settings</span>
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
                        isActive={pathname.startsWith("/contracts-per-supplier")}
                      >
                        <span>Contracts per Supplier</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/contact-persons-suppliers" />}
                        isActive={pathname.startsWith("/contact-persons-suppliers")}
                      >
                        <span>Contact Persons Suppliers</span>
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
