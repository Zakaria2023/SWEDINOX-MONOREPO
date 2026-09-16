"use client";

import { NAV_ITEMS } from "@/lib/constants";
import { isPathActive, titleFromPath } from "@/lib/helpers";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

/**
 * Which page you are on, in the bar at the top of it.
 *
 * The name comes from the menu rather than from each page, so the header and
 * the sidebar cannot disagree about what a screen is called, and a page that
 * sets no heading of its own is still named up here.
 *
 * The longest matching link wins: `/purchase-orders-to-be-received` is its own
 * entry and must not be answered by `/purchase-orders`, and a detail page under
 * `/purchase-receivals/<uuid>` keeps its overview's name.
 */
export const HeaderPageTitle = () => {
  const pathname = usePathname();

  const match = NAV_ITEMS.filter((item) => isPathActive(item.href, pathname)).sort(
    (left, right) => right.href.length - left.href.length,
  )[0];

  const title = match?.label ?? titleFromPath(pathname);
  if (!title) {
    return null;
  }

  // What the page is doing to the record, when it is doing something: the menu
  // only ever names the overview, and "Purchase orders" over a form that is
  // creating one would be telling the reader the wrong thing.
  const lastSegment = pathname.split("/").filter(Boolean).at(-1);
  const action =
    lastSegment === "new"
      ? "New"
      : lastSegment === "edit"
        ? "Edit"
        : lastSegment === "add"
          ? "New"
          : null;

  return (
    <div className="flex min-w-0 items-center gap-1.5 text-sm">
      {match && (
        <span className="hidden text-muted-foreground md:inline">
          {match.groupLabel}
        </span>
      )}
      {match && (
        <ChevronRight className="hidden size-3.5 text-muted-foreground md:inline" />
      )}
      <span className="line-clamp-1 font-medium text-foreground">{title}</span>
      {action && (
        <>
          <ChevronRight className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{action}</span>
        </>
      )}
    </div>
  );
};
