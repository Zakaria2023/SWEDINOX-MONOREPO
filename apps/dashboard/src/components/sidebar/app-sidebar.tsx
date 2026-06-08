"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronRight } from "lucide-react";
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
  const isCompanyActive =
    pathname.startsWith("/companies") || pathname.startsWith("/addresses");
  const [isCompanyOpen, setIsCompanyOpen] = useState(isCompanyActive);

  useEffect(() => {
    if (isCompanyActive) {
      setIsCompanyOpen(true);
    }
  }, [isCompanyActive]);

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
                  aria-expanded={isCompanyOpen}
                  isActive={isCompanyActive}
                  onClick={() => setIsCompanyOpen((isOpen) => !isOpen)}
                >
                  <Building2 />
                  <span>Company</span>
                  <ChevronRight
                    className={cn("ml-auto transition-transform", {
                      "rotate-90": isCompanyOpen,
                    })}
                  />
                </SidebarMenuButton>
                {isCompanyOpen && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/companies" />}
                        isActive={pathname.startsWith("/companies")}
                      >
                        <span>Companies</span>
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
