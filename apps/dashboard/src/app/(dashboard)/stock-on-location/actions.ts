"use server";

import { STOCK_LOT_COLUMNS } from "@/app/(dashboard)/stock-on-location/columns";
import { describeError } from "@/lib/helpers";
import { exportRows } from "@/lib/server/excel";
import {
  countStockLotOverview,
  StockLotOverviewRow,
  stockLotOverviewRows,
} from "@/lib/server/stock-lot-overview";
import { runPaged } from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";

/** Every lot still holding goods, wherever it is and whoever owns it. */
export const getStockOnLocation = async (
  query: TableQuery,
): Promise<Paged<StockLotOverviewRow>> => {
  try {
    return await runPaged(query, {
      rows: stockLotOverviewRows(query, "all"),
      count: () => countStockLotOverview(query, "all"),
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch stock on location"));
  }
};

export const exportStockOnLocation = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Stock on location",
    columns: STOCK_LOT_COLUMNS,
    columnKeys,
    rows: stockLotOverviewRows(parseTableQuery(params), "all"),
  });
