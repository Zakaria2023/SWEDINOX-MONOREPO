"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Users } from "lucide-react";
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
  const isCustomersActive = pathname.startsWith("/customers");
  const [isCustomersOpen, setIsCustomersOpen] = useState(isCustomersActive);

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
                  aria-expanded={isCustomersOpen}
                  isActive={isCustomersActive}
                  onClick={() => setIsCustomersOpen((isOpen) => !isOpen)}
                >
                  <Users />
                  <span>Customers</span>
                  <ChevronRight
                    className={cn("ml-auto transition-transform", {
                      "rotate-90": isCustomersOpen,
                    })}
                  />
                </SidebarMenuButton>
                {isCustomersOpen && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/addresses" />}
                        isActive={pathname === "/addresses"}
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
