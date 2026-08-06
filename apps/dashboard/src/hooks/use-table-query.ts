"use client";

import { tableQueryString } from "@/lib/table-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * Reads the current table view out of the URL and writes changes back to it.
 *
 * Every control on an overview — the search box, a filter, a column header, the
 * pager — goes through this. None of them holds the value it shows in state:
 * the URL is the state, so two controls can never disagree, the back button
 * steps through views, and a reload lands on the same one.
 *
 * `replace` rather than `push` because typing in a search box would otherwise
 * put one history entry per keystroke, and `scroll: false` because the reader
 * is looking at the table, not the top of the page.
 *
 * The navigation is wrapped in a transition so the current rows stay on screen
 * and readable while the next ones are fetched, instead of the table blanking
 * on every keystroke. `isPending` is what a control dims itself with.
 */
export const useTableQuery = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Stable between renders, changing only when the URL it writes against does.
  // A control that debounces its input depends on this identity: rebuilding it
  // every render would restart the timer on each keystroke and the search would
  // never fire.
  const setParams = useCallback(
    (patch: Record<string, string | string[] | null>) => {
      const query = tableQueryString(new URLSearchParams(searchParams), patch);
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [router, pathname, searchParams],
  );

  return {
    searchParams,
    /** The current value of one param, or "" when it is not set. */
    value: (key: string) => searchParams.get(key) ?? "",
    /** Every value of a param that may appear more than once. */
    values: (key: string) => searchParams.getAll(key),
    setParams,
    isPending,
  };
};
