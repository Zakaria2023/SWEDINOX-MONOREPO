"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronRight, ContactRound, MapPin, MessageSquare, Settings, Users } from "lucide-react";
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
    pathname.startsWith("/communication-settings");
  const isSalesActive =
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/contact-groups");
  const isConfigActive = pathname.startsWith("/locations");

  const [isCustomersOpen, setIsCustomersOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const isCustomersExpanded = isCustomersOpen || isCustomersActive;
  const isCompanyExpanded = isCompanyOpen || isCompanyActive;
  const isSalesExpanded = isSalesOpen || isSalesActive;
  const isConfigExpanded = isConfigOpen || isConfigActive;

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
                        render={<Link href="/communication-settings" />}
                        isActive={pathname.startsWith("/communication-settings")}
                      >
                        <span>Communication Settings</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              {/* ── Sales ── */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-expanded={isSalesExpanded}
                  onClick={() => setIsSalesOpen((o) => !o)}
                >
                  <ContactRound />
                  <span>Sales</span>
                  <ChevronRight
                    className={cn("ml-auto transition-transform", {
                      "rotate-90": isSalesExpanded,
                    })}
                  />
                </SidebarMenuButton>
                {isSalesExpanded && (
                  <SidebarMenuSub>
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

              {/* ── Configuration ── */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-expanded={isConfigExpanded}
                  onClick={() => setIsConfigOpen((o) => !o)}
                >
                  <Settings />
                  <span>Configuration</span>
                  <ChevronRight
                    className={cn("ml-auto transition-transform", {
                      "rotate-90": isConfigExpanded,
                    })}
                  />
                </SidebarMenuButton>
                {isConfigExpanded && (
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

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
