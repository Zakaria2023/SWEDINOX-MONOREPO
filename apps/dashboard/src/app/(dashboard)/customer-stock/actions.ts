"use server";

import { CUSTOMER_STOCK_LOT_COLUMNS } from "@/app/(dashboard)/stock-on-location/columns";
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

/**
 * `Customer stock on location` — the lots a customer owns and we hold: the
 * same 54 columns as `Stock on location`, scoped to an owner.
 */
export const getCustomerStock = async (
  query: TableQuery,
): Promise<Paged<StockLotOverviewRow>> => {
  try {
    return await runPaged(query, {
      rows: stockLotOverviewRows(query, "customer"),
      count: () => countStockLotOverview(query, "customer"),
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch customer stock"));
  }
};

export const exportCustomerStock = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Customer stock on location",
    columns: CUSTOMER_STOCK_LOT_COLUMNS,
    columnKeys,
    rows: stockLotOverviewRows(parseTableQuery(params), "customer"),
  });
