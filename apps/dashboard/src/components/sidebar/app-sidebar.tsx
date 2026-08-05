"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/shadcn/sidebar";
import { DASHBOARD_HREF, NAV_GROUPS } from "@/lib/constants";
import { cn, isPathActive } from "@/lib/helpers";
import { ChevronRight, Layers, LayoutDashboard, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FocusEvent, useEffect, useMemo, useRef, useState } from "react";

// Links wrap onto a second line rather than losing their ends: several entries
// ("Customer Revenue per Revenue Group") only differ in the last word, so a
// clipped label is not just untidy, it stops naming the page.
const LINK_CLASS =
  "h-auto min-h-9 items-start gap-2 rounded-lg px-2.5 py-2 leading-snug whitespace-normal text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground";

// The page you are on: filled, in full-strength ink, with a bar down its left
// edge that lines up with the group's guide line.
const ACTIVE_LINK_CLASS =
  "data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-foreground";

// The group holding the current page. It reads as emphasised rather than
// selected, since the group itself is not a page.
const ACTIVE_GROUP_CLASS =
  "data-active:bg-sidebar-accent/60 data-active:font-medium data-active:text-sidebar-foreground";

const GROUP_BUTTON_CLASS =
  "h-10 gap-3 rounded-lg px-2.5 text-base font-medium text-sidebar-foreground/80 transition-colors group-data-[collapsible=icon]:mx-auto hover:bg-sidebar-accent hover:text-sidebar-foreground [&>svg]:text-sidebar-foreground/60 [&>svg]:transition-colors hover:[&>svg]:text-sidebar-foreground";

export const AppSidebar = () => {
  const pathname = usePathname();
  const { isMobile, setOpen, state } = useSidebar();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

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
  const isCollapsed = state === "collapsed" && !isMobile;

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

  // The rail opens on hover and closes again on the way out. Tab does the same,
  // so the nav is reachable without a pointer; the panel only closes once focus
  // has actually left it, never while moving between its own links.
  //
  // On a phone the panel is a sheet the user opens deliberately, so none of
  // this applies — and the props would land on the sheet's own root rather than
  // on anything a pointer can hover.
  const railProps = isMobile
    ? {}
    : {
        // Above the page's own sticky furniture — a table header sticks at
        // z-10 too, and being later in the DOM it would otherwise paint over
        // the panel the moment it opens.
        className:
          "z-30 border-r border-sidebar-border transition-shadow duration-200 group-data-[state=expanded]:shadow-2xl",
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
        onFocusCapture: () => setOpen(true),
        onBlurCapture: (event: FocusEvent<HTMLDivElement>) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setOpen(false);
          }
        },
      };

  const openSearch = () => {
    setOpen(true);
    // The field is only rendered at full width, so it can be focused once the
    // panel has been told to expand.
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  return (
    <Sidebar collapsible="icon" {...railProps}>
      <SidebarHeader className="gap-3 overflow-hidden p-3 pb-2">
        <Link
          href={DASHBOARD_HREF}
          aria-label="Swedinox dashboard"
          className={cn(
            "flex min-w-0 items-center gap-3 rounded-lg transition-opacity hover:opacity-80",
            isCollapsed && "justify-center",
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Layers size={16} />
          </span>
          {!isCollapsed && (
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold tracking-tight">
                Swedinox
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                Back office
              </span>
            </span>
          )}
        </Link>

        {isCollapsed ? (
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search navigation"
            className="mx-auto flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Search size={16} />
          </button>
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-sidebar-foreground/50" />
            <SidebarInput
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search…"
              aria-label="Search navigation"
              className="h-9 rounded-lg border-sidebar-border bg-sidebar-accent/50 ps-8 text-sm"
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            {isSearching && searchResults.length > 0 && (
              <SidebarMenu className="gap-1">
                {searchResults.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isPathActive(item.href, pathname)}
                      className={cn(
                        "h-auto min-h-9 flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 whitespace-normal",
                        ACTIVE_LINK_CLASS,
                      )}
                    >
                      <span className="w-full text-sm leading-snug">
                        {item.label}
                      </span>
                      <span className="text-xs text-sidebar-foreground/55">
                        {item.groupLabel}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}

            {isSearching && searchResults.length === 0 && (
              <p className="px-2.5 py-2 text-sm text-sidebar-foreground/60">
                No results for “{query.trim()}”
              </p>
            )}

            {!isSearching && (
              <SidebarMenu className="gap-0.5">
                {/* The overview sits above the groups and is matched on the
                    exact path: every route starts with "/", so the usual prefix
                    test would leave it lit on every page. */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href={DASHBOARD_HREF} />}
                    isActive={pathname === DASHBOARD_HREF}
                    className={cn(GROUP_BUTTON_CLASS, ACTIVE_GROUP_CLASS)}
                  >
                    <LayoutDashboard />
                    {!isCollapsed && <span>Dashboard</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {NAV_GROUPS.map((group) => {
                  const Icon = group.icon;
                  const isExpanded = openGroups[group.key];
                  const isGroupActive = group.items.some((item) =>
                    isPathActive(item.href, pathname),
                  );
                  return (
                    <SidebarMenuItem key={group.key}>
                      <SidebarMenuButton
                        aria-expanded={isExpanded}
                        isActive={isGroupActive && !isExpanded}
                        className={cn(GROUP_BUTTON_CLASS, ACTIVE_GROUP_CLASS)}
                        onClick={() => toggleGroup(group.key)}
                      >
                        <Icon />
                        {!isCollapsed && (
                          <>
                            <span>{group.label}</span>
                            <ChevronRight
                              className={cn(
                                "ms-auto text-sidebar-foreground/40 transition-transform duration-200",
                                { "rotate-90": isExpanded },
                              )}
                            />
                          </>
                        )}
                      </SidebarMenuButton>
                      {isExpanded && (
                        <SidebarMenuSub className="mx-4 my-1 gap-0.5 border-sidebar-border px-2.5 py-0">
                          {group.items.map((item) => {
                            const isItemActive = isPathActive(
                              item.href,
                              pathname,
                            );
                            return (
                              <SidebarMenuSubItem key={item.href}>
                                <SidebarMenuSubButton
                                  render={<Link href={item.href} />}
                                  size="md"
                                  isActive={isItemActive}
                                  className={cn(
                                    "relative",
                                    LINK_CLASS,
                                    ACTIVE_LINK_CLASS,
                                  )}
                                >
                                  {isItemActive && (
                                    <span
                                      aria-hidden
                                      className="absolute top-1/2 -left-2.5 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary"
                                    />
                                  )}
                                  <span>{item.label}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
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

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:hidden"></SidebarFooter>
    </Sidebar>
  );
};
