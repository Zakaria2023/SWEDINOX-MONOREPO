"use server";

import { ORDER_LINES_STILL_TO_BE_CALLED_COLUMNS } from "@/app/(dashboard)/orders-still-to-be-called/columns";
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

/** `Order lines still to be called` — lines of call-off orders, paged in SQL. */
export const getOrderLinesStillToBeCalled = async (
  query: TableQuery,
): Promise<Paged<CallOffLineRow>> => {
  try {
    return await runPaged(query, {
      rows: callOffLineRows(query, "open"),
      count: () => countCallOffLines(query, "open"),
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch Order lines still to be called"));
  }
};

export const exportOrderLinesStillToBeCalled = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Order lines still to be called",
    columns: ORDER_LINES_STILL_TO_BE_CALLED_COLUMNS,
    columnKeys,
    rows: callOffLineRows(parseTableQuery(params), "open"),
  });
