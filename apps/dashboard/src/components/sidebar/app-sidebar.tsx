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
import {
  DASHBOARD_HREF,
  NAV_ITEMS,
  NAV_TABS,
  NavGroup,
  NavItem,
} from "@/lib/constants";
import { cn, countLabel, isPathActive } from "@/lib/helpers";
import {
  ChevronRight,
  Layers,
  LayoutDashboard,
  Search,
  SearchX,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FocusEvent, useEffect, useMemo, useRef, useState } from "react";

// Links wrap onto a second line rather than losing their ends: several entries
// ("Customer revenue per revenue group") only differ in the last word, so a
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

/** The tab a path belongs to, so navigation lands on the right one. */
const tabForPath = (pathname: string): string => {
  const match = NAV_ITEMS.find((item) => isPathActive(item.href, pathname));
  return match?.tabKey ?? NAV_TABS[1].key;
};

const groupsOf = (tabKey: string): NavGroup[] => {
  const tab = NAV_TABS.find((candidate) => candidate.key === tabKey);
  return tab && tab.kind === "grouped" ? tab.groups : [];
};

const itemsOf = (tabKey: string): NavItem[] => {
  const tab = NAV_TABS.find((candidate) => candidate.key === tabKey);
  return tab && tab.kind === "flat" ? tab.items : [];
};

export const AppSidebar = () => {
  const pathname = usePathname();
  const { isMobile, setOpen, state } = useSidebar();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState(() => tabForPath(pathname));

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of groupsOf("views")) {
      initial[group.key] = group.items.some((item) =>
        isPathActive(item.href, pathname),
      );
    }
    return initial;
  });

  // Follow the page: navigating to an overview should not leave the menu
  // sitting on the Actions tab with nothing highlighted.
  useEffect(() => {
    setActiveTab(tabForPath(pathname));
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of groupsOf("views")) {
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

  // Search reaches across all three tabs: somebody looking for "stock" should
  // not have to know which of them it was filed under.
  const searchResults = useMemo(() => {
    if (!trimmedQuery) {
      return [];
    }
    return NAV_ITEMS.filter((item) =>
      item.label.toLowerCase().includes(trimmedQuery),
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

  const renderLink = (item: NavItem) => {
    const isItemActive = isPathActive(item.href, pathname);
    return (
      <SidebarMenuSubItem key={item.href}>
        <SidebarMenuSubButton
          render={<Link href={item.href} />}
          size="md"
          isActive={isItemActive}
          className={cn("relative", LINK_CLASS, ACTIVE_LINK_CLASS)}
        >
          {isItemActive && (
            <span
              aria-hidden
              className="bg-sidebar-primary absolute top-1/2 -left-2.5 h-4 w-0.5 -translate-y-1/2 rounded-full"
            />
          )}
          <span>{item.label}</span>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
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
          <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Layers size={16} />
          </span>
          {!isCollapsed && (
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold tracking-tight">
                Swedinox
              </span>
              <span className="text-sidebar-foreground/60 text-xs">
                Back office
              </span>
            </span>
          )}
        </Link>

        {isCollapsed ? (
          <button
            type="button"
            onClick={openSearch}
            aria-label={
              isSearching
                ? `Search navigation — ${countLabel(searchResults.length, "match", "matches")} for ${query.trim()}`
                : "Search navigation"
            }
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground relative mx-auto flex size-8 items-center justify-center rounded-lg transition-colors"
          >
            <Search size={16} />
            {/* The icons below are a filtered list, not the whole menu — without
                this the collapsed rail gives no sign a query is still on. */}
            {isSearching && (
              <span
                aria-hidden
                className="bg-sidebar-primary text-sidebar-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs leading-none"
              >
                {searchResults.length}
              </span>
            )}
          </button>
        ) : (
          <div className="relative">
            <Search className="text-sidebar-foreground/50 pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <SidebarInput
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search…"
              aria-label="Search navigation"
              className="border-sidebar-border bg-sidebar-accent/50 h-9 rounded-lg ps-8 text-sm"
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            {/* A collapsed rail is too narrow for a result's label, and the
                clipped text named nothing — every "Order ..." page came out as
                "Ord". Collapsed, a result is a magnifier with the full label on
                the tooltip; the panel opens on hover for the rest. */}
            {isSearching && searchResults.length > 0 && (
              <SidebarMenu className={isCollapsed ? "gap-0.5" : "gap-1"}>
                {searchResults.map((item) => (
                  <SidebarMenuItem key={`${item.tabKey}-${item.href}`}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isPathActive(item.href, pathname)}
                      tooltip={`${item.label} — ${item.groupLabel}`}
                      className={cn(
                        isCollapsed
                          ? GROUP_BUTTON_CLASS
                          : "h-auto min-h-9 flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 whitespace-normal",
                        ACTIVE_LINK_CLASS,
                      )}
                    >
                      {isCollapsed ? (
                        <Search />
                      ) : (
                        <>
                          <span className="w-full text-sm leading-snug">
                            {item.label}
                          </span>
                          <span className="text-sidebar-foreground/55 text-xs">
                            {item.groupLabel}
                          </span>
                        </>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}

            {isSearching &&
              searchResults.length === 0 &&
              (isCollapsed ? (
                <span
                  aria-label={`No results for ${query.trim()}`}
                  className="text-sidebar-foreground/40 mx-auto flex size-8 items-center justify-center"
                >
                  <SearchX size={16} />
                </span>
              ) : (
                <p className="text-sidebar-foreground/60 px-2.5 py-2 text-sm">
                  No results for “{query.trim()}”
                </p>
              ))}

            {!isSearching && (
              <SidebarMenu className="gap-0.5">
                {/* The overview sits above the tabs and is matched on the exact
                    path: every route starts with "/", so the usual prefix test
                    would leave it lit on every page. */}
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

                {/* The three tabs. Expanded they are a row of buttons; on the
                    collapsed rail there is no room for a row, so they stack as
                    icons and read as the menu they switch between. */}
                <div
                  role="tablist"
                  aria-label="Navigation"
                  className={cn(
                    "my-1 flex gap-0.5",
                    isCollapsed ? "flex-col items-center" : "flex-row",
                  )}
                >
                  {NAV_TABS.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = tab.key === activeTab;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        title={tab.label}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors",
                          isCollapsed ? "size-8" : "flex-1 px-2 py-2",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-foreground"
                            : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        )}
                      >
                        <TabIcon className="size-4 shrink-0" />
                        {!isCollapsed && <span>{tab.label}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* A flat tab is short enough to show whole — no group to open
                    before you can reach anything. */}
                {itemsOf(activeTab).length > 0 && !isCollapsed && (
                  <SidebarMenuSub className="border-sidebar-border mx-4 my-1 gap-0.5 px-2.5 py-0">
                    {itemsOf(activeTab).map(renderLink)}
                  </SidebarMenuSub>
                )}

                {groupsOf(activeTab).map((group) => {
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
                        tooltip={group.label}
                        className={cn(GROUP_BUTTON_CLASS, ACTIVE_GROUP_CLASS)}
                        onClick={() => toggleGroup(group.key)}
                      >
                        <Icon />
                        {!isCollapsed && (
                          <>
                            <span>{group.label}</span>
                            <ChevronRight
                              className={cn(
                                "text-sidebar-foreground/40 ms-auto transition-transform duration-200",
                                { "rotate-90": isExpanded },
                              )}
                            />
                          </>
                        )}
                      </SidebarMenuButton>
                      {isExpanded && !isCollapsed && (
                        <SidebarMenuSub className="border-sidebar-border mx-4 my-1 gap-0.5 px-2.5 py-0">
                          {group.items.map(renderLink)}
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
