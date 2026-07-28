"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  SelectSigmaNestBlockedOrders,
  SigmaNestBlockedOrders,
} from "@/db/schema/integrations";
import { describeError } from "@/lib/helpers";
import { asc, eq, getTableColumns } from "drizzle-orm";

export type SigmaNestBlockedOrderRow = SelectSigmaNestBlockedOrders & {
  linkedCustomerName: SelectCompanies["companyName"] | null;
};

// Work orders SigmaNest has refused to release. Ordered by delivery date
// ascending: the ones due soonest are the ones costing money to leave blocked.
export const getSigmaNestBlockedOrders = async (): Promise<
  SigmaNestBlockedOrderRow[]
> => {
  try {
    return await db
      .select({
        ...getTableColumns(SigmaNestBlockedOrders),
        linkedCustomerName: Companies.companyName,
      })
      .from(SigmaNestBlockedOrders)
      .leftJoin(Companies, eq(SigmaNestBlockedOrders.customerUuid, Companies.uuid))
      .orderBy(asc(SigmaNestBlockedOrders.deliveryDate));
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch SigmaNest blocked orders"),
    );
  }
};
