"use server";

import { ORDERS_STILL_TO_BE_CALLED_COLUMNS } from "@/app/(dashboard)/orders-still-to-be-called/columns";
import { describeError } from "@/lib/helpers";
import {
  CallOffLineRow,
  callOffLineRows,
  countCallOffLines,
} from "@/lib/server/call-off-lines";
import { exportRows } from "@/lib/server/excel";
import { runPaged } from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";

/** `Orders still to be called` — lines of call-off orders, paged in SQL. */
export const getOrdersStillToBeCalled = async (
  query: TableQuery,
): Promise<Paged<CallOffLineRow>> => {
  try {
    return await runPaged(query, {
      rows: callOffLineRows(query, "all"),
      count: () => countCallOffLines(query, "all"),
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch Orders still to be called"));
  }
};

export const exportOrdersStillToBeCalled = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Orders still to be called",
    columns: ORDERS_STILL_TO_BE_CALLED_COLUMNS,
    columnKeys,
    rows: callOffLineRows(parseTableQuery(params), "all"),
  });
