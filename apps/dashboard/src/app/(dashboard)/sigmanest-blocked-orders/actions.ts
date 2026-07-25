"use server";

// One SigmaNest blocked order (work order held up in the SigmaNest nesting
// software integration).
export type SigmaNestBlockedOrderRow = {
  key: string;
  workOrder: string | null;
  customer: string | null;
  deliveryDate: string | null;
  purchaseOrder: string | null;
  salesOrder: string | null;
};

// The SigmaNest nesting-software integration (and its blocked-order feed) is not
// modelled in this system, so there is no source to list yet.
export const getSigmaNestBlockedOrders = async (): Promise<
  SigmaNestBlockedOrderRow[]
> => [];
