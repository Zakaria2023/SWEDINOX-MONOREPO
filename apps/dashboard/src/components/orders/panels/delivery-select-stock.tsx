"use client";

import { useState, useTransition } from "react";
import { PackageSearch } from "lucide-react";
import { assignOrderLineStock } from "@/app/(dashboard)/orders/actions";
import { StockSearchDialog } from "@/components/orders/stock-search-dialog";
import { Button } from "@/components/shadcn/button";
import { FormError } from "@/components/ui/form-error";

type Props = {
  orderUuid: string;
  orderItemUuid: string;
  productCode: string | null;
  /** Null when a lot can be chosen; otherwise why it cannot. */
  disabledReason: string | null;
};

/**
 * `Deliveries → Select stock`: the `Voorraad` window on the line's article,
 * its lot ticked and taken with `Use selected lines`. Choosing it reserves the
 * lot to the delivery and clears `Blocked` (O108309/10, 16-10-2026).
 */
export const DeliverySelectStock = ({
  orderUuid,
  orderItemUuid,
  productCode,
  disabledReason,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const reserve = (stockUuid: string) => {
    setIsOpen(false);
    setError(undefined);
    startTransition(async () => {
      const result = await assignOrderLineStock(
        orderUuid,
        orderItemUuid,
        stockUuid,
      );
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={disabledReason !== null || isPending}
        title={disabledReason ?? undefined}
      >
        <PackageSearch className="size-4" />
        Select stock
      </Button>
      <FormError>{error}</FormError>
      <StockSearchDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        sources={["stock"]}
        initialProductCode={productCode}
        // `Use selected article` takes the article's fullest lot.
        onChoose={(choice) => {
          if (choice.lot) {
            reserve(choice.lot.uuid);
          }
        }}
        onChooseLots={(lots) => {
          const [lot] = lots;
          if (!lot) {
            return;
          }
          if (lots.length > 1) {
            setError("A delivery is drawn from one lot — tick one.");
            return;
          }
          reserve(lot.uuid);
        }}
      />
    </>
  );
};
