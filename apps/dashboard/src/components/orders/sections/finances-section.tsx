"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFormContext } from "react-hook-form";
import { unblockOrder } from "@/app/(dashboard)/financially-blocked/actions";
import { OrderFormValues } from "@/app/(dashboard)/orders/validation";
import { Input } from "@/components/shadcn/input";
import { FormError } from "@/components/ui/form-error";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { SelectOption } from "@/components/shadcn/select";

type SavedBlock = {
  orderUuid: string;
  blocked: boolean;
};

type Props = {
  addressOptions: SelectOption[];
  paymentTermOptions: SelectOption[];
  /**
   * On a saved order: the block as it stands. Unticking it releases the order
   * — immediately, as on the reference's 102191 — through Finance's own
   * release, which records who did it. A block is not ticked by hand once the
   * order exists; the credit rule sets it.
   */
  savedBlock?: SavedBlock | null;
};

export const FinancesSection = ({
  addressOptions,
  paymentTermOptions,
  savedBlock = null,
}: Props) => {
  const { register, control } = useFormContext<OrderFormValues>();
  const router = useRouter();
  const [isReleasing, startRelease] = useTransition();
  const [releaseError, setReleaseError] = useState<string | undefined>();

  const releaseBlock = (orderUuid: string) => {
    setReleaseError(undefined);
    startRelease(async () => {
      const result = await unblockOrder(orderUuid);
      if (result.error) {
        setReleaseError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <section className="space-y-4">
      <FormError>{releaseError}</FormError>
      <div className="grid grid-cols-3 gap-3">
        <Controller
          control={control}
          name="showNetPrice"
          render={({ field }) => (
            <FormCheckboxCard
              label="Show net price"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="scrapSurchargeSeparate"
          render={({ field }) => (
            <FormCheckboxCard
              label="Scrap surcharge separately"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="calculateVatIfApplicable"
          render={({ field }) => (
            <FormCheckboxCard
              label="Calculate VAT if applicable"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        {savedBlock ? (
          <FormCheckboxCard
            label={isReleasing ? "Releasing…" : "Financial blockage"}
            checked={savedBlock.blocked}
            active={savedBlock.blocked}
            disabled={!savedBlock.blocked || isReleasing}
            title={
              savedBlock.blocked
                ? "Untick to release the block"
                : "Set by the credit rule"
            }
            onChange={(e) => {
              if (!e.target.checked) {
                releaseBlock(savedBlock.orderUuid);
              }
            }}
          />
        ) : (
          <Controller
            control={control}
            name="financialBlockage"
            render={({ field }) => (
              <FormCheckboxCard
                label="Financial blockage"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        )}
        <Controller
          control={control}
          name="invoiceBlockage"
          render={({ field }) => (
            <FormCheckboxCard
              label="Invoice blockage"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="onlyTotalAmountOnInvoice"
          render={({ field }) => (
            <FormCheckboxCard
              label="Only total amount on invoice"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="includeOptionPricesInMaterialPrices"
          render={({ field }) => (
            <FormCheckboxCard
              label="Include option prices in material prices"
              checked={field.value}
              active={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          control={control}
          id="paymentTerms"
          name="paymentTerms"
          label="Payment Terms"
          options={paymentTermOptions}
          emptyValue=""
        />

        <FormSelectField
          control={control}
          id="billingAddressUuid"
          name="billingAddressUuid"
          label="Billing Address"
          options={addressOptions}
          emptyValue=""
          disabled={addressOptions.length <= 1}
        />

        {/* Read-only on purpose. The reference greys this field out: a hold is
            explained by the rule that applied it, never chosen by the person
            looking at it, and it clears itself when the hold is released. */}
        <div>
          <FormLabel htmlFor="blockingReason">Blocking Reason</FormLabel>
          <Input
            id="blockingReason"
            readOnly
            className="bg-muted text-muted-foreground"
            {...register("blockingReason")}
          />
        </div>
      </div>
    </section>
  );
};
