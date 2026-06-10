"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronRight, Users } from "lucide-react";
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

  const isCustomersActive = pathname.startsWith("/addresses");
  const isCompanyActive =
    pathname.startsWith("/companies") ||
    pathname.startsWith("/company-contacts") ||
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/contact-groups");

  const [isCustomersOpen, setIsCustomersOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);

  const isCustomersExpanded = isCustomersOpen || isCustomersActive;
  const isCompanyExpanded = isCompanyOpen || isCompanyActive;

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

              {/* ── Customers ── */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-expanded={isCustomersExpanded}
                  onClick={() => setIsCustomersOpen((o) => !o)}
                >
                  <Users />
                  <span>Customers</span>
                  <ChevronRight
                    className={cn("ml-auto transition-transform", {
                      "rotate-90": isCustomersExpanded,
                    })}
                  />
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
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              {/* ── Company ── */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-expanded={isCompanyExpanded}
                  onClick={() => setIsCompanyOpen((o) => !o)}
                >
                  <Building2 />
                  <span>Company</span>
                  <ChevronRight
                    className={cn("ml-auto transition-transform", {
                      "rotate-90": isCompanyExpanded,
                    })}
                  />
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
                        render={<Link href="/company-contacts" />}
                        isActive={pathname.startsWith("/company-contacts")}
                      >
                        <span>Company Contacts</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/contacts" />}
                        isActive={pathname.startsWith("/contacts")}
                      >
                        <span>Contacts</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/contact-groups" />}
                        isActive={pathname.startsWith("/contact-groups")}
                      >
                        <span>Contact Groups</span>
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
