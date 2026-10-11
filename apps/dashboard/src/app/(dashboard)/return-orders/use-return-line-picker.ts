"use client";

import { useCallback } from "react";
import { StockSearchChoice } from "@/components/orders/stock-search-dialog";
import { getReturnableLines, ReturnableLine } from "./actions";

type UseReturnLinePickerParams = {
  companyUuid: string;
  /** The sales order the return is raised against, when it names one. */
  orderUuid?: string | null;
};

type PickedLine = { line: ReturnableLine; error?: undefined };

type PickError = { line?: undefined; error: string };

/**
 * The `…` on a return line opens the Stock window, as the reference's does
 * (return 290247, 29-9-2026). What is chosen there has to be something this
 * customer was delivered and invoiced, or there is nothing to credit: the lot
 * it left on when it is still on the shelf, otherwise the latest invoiced line
 * of that article not already on the return.
 */
export const useReturnLinePicker = ({
  companyUuid,
  orderUuid = null,
}: UseReturnLinePickerParams) =>
  useCallback(
    async (
      choice: StockSearchChoice,
      excludedOrderItemUuids: string[],
    ): Promise<PickedLine | PickError> => {
      const productUuid =
        choice.kind === "lot"
          ? choice.lot.productUuid
          : choice.variant.productUuid;
      const productCode =
        choice.kind === "lot"
          ? choice.lot.productCode
          : choice.variant.productCode;
      const lotUuid = choice.lot?.uuid ?? null;

      if (!companyUuid) {
        return { error: "Choose the customer first." };
      }

      const returnable = await getReturnableLines(companyUuid);
      const candidates = returnable.filter(
        (line) =>
          !excludedOrderItemUuids.includes(line.orderItemUuid) &&
          (!orderUuid || line.orderUuid === orderUuid),
      );
      const match =
        (lotUuid
          ? candidates.find((line) => line.stockUuid === lotUuid)
          : undefined) ??
        candidates.find((line) => line.productUuid === productUuid);

      if (!match) {
        return {
          error: `${productCode ?? "This article"} was not invoiced to this customer${orderUuid ? " on this sales order" : ""}, or is already on this return — there is nothing to credit.`,
        };
      }
      return { line: match };
    },
    [companyUuid, orderUuid],
  );
