"use server";

import { globalSearch, SearchResults } from "@/lib/server/global-search";

/**
 * Everything matching what the user typed, grouped by the screen it lives on.
 *
 * The type-ahead in the header calls this; the results page calls the same
 * function directly, so both show the same answer.
 */
export const searchEverything = async (term: string): Promise<SearchResults> =>
  globalSearch(term);
