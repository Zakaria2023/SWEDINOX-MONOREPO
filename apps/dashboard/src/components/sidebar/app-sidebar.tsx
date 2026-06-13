"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  ChevronRight,
  ContactRound,
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
import { useI18nContext } from "@/providers/I18NextProvider";

export const AppSidebar = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { dir } = useI18nContext();
  const isRtl = dir === "rtl";

  const chevronClass = (isExpanded: boolean) =>
    cn("ms-auto transition-transform", {
      "rotate-90": isExpanded,
      "rotate-180": !isExpanded && isRtl,
    });

  const isCustomersActive = pathname.startsWith("/addresses");
  const isCompanyActive =
    pathname.startsWith("/companies") ||
    pathname.startsWith("/communication-settings");
  const isSalesActive =
    pathname.startsWith("/contracts") ||
    pathname.startsWith("/contract-groups");
  const [isCustomersOpen, setIsCustomersOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);

  const isCustomersExpanded = isCustomersOpen || isCustomersActive;
  const isCompanyExpanded = isCompanyOpen || isCompanyActive;
  const isSalesExpanded = isSalesOpen || isSalesActive;

  return (
    <Sidebar side={isRtl ? "right" : "left"}>
      <SidebarHeader className="px-4 py-5">
        <span className="text-lg font-semibold tracking-tight">
          {t("app-sidebar.brand")}
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("app-sidebar.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  aria-expanded={isCustomersExpanded}
                  onClick={() => setIsCustomersOpen((open) => !open)}
                >
                  <Users />
                  <span>{t("app-sidebar.groups.customers")}</span>
                  <ChevronRight className={chevronClass(isCustomersExpanded)} />
                </SidebarMenuButton>
                {isCustomersExpanded && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/addresses" />}
                        isActive={pathname.startsWith("/addresses")}
                      >
                        <span>{t("app-sidebar.items.addresses")}</span>
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
                  <span>{t("app-sidebar.groups.company")}</span>
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
                        <span>{t("app-sidebar.items.companies")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/communication-settings" />}
                        isActive={pathname.startsWith("/communication-settings")}
                      >
                        <span>
                          {t("app-sidebar.items.communication-settings")}
                        </span>
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
                  <span>{t("app-sidebar.groups.sales")}</span>
                  <ChevronRight className={chevronClass(isSalesExpanded)} />
                </SidebarMenuButton>
                {isSalesExpanded && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/contracts" />}
                        isActive={pathname.startsWith("/contracts")}
                      >
                        <span>{t("app-sidebar.items.contracts")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/contract-groups" />}
                        isActive={pathname.startsWith("/contract-groups")}
                      >
                        <span>{t("app-sidebar.items.contract-groups")}</span>
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
