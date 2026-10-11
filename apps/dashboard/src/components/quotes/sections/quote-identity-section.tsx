"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import { QuoteFormValues } from "@/app/(dashboard)/quotes/validation";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { SearchSelect } from "@/components/shadcn/search-select";
import { Select, SelectOption } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { ClerkUserOption } from "@/lib/server/clerk";

type Props = {
  companyOptions: SelectOption[];
  contactOptions: SelectOption[];
  projectOptions: SelectOption[];
  contractOptions: SelectOption[];
  requestMethodOptions: SelectOption[];
  clerkUsers: ClerkUserOption[];
  isLoadingCompanyData: boolean;
  handleCompanyChange: (uuid: string) => void;
};

/**
 * The reference's header, left block, top: who the quote is for and who
 * wrote it — `Customer` · `Contact` · `Customer ref.` · `Onze referentie` ·
 * `Order method` · `Seller` · `Price date` · `Project` · `Order category` —
 * then the quote's own validity: `Quote date` and `Valid u/i`, both greyed
 * because Finalize stamps them (#392, #396), and the expiry.
 */
export const QuoteIdentitySection = ({
  companyOptions,
  contactOptions,
  projectOptions,
  contractOptions,
  requestMethodOptions,
  clerkUsers,
  isLoadingCompanyData,
  handleCompanyChange,
}: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<QuoteFormValues>();
  const expired = useWatch({ control, name: "expired" });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormLabel htmlFor="companyUuid" required>
            Customer
            {isLoadingCompanyData && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Loading...
              </span>
            )}
          </FormLabel>
          {/* The reference's Customer is a code you type and search (#391),
              not a list of every company. */}
          <Controller
            control={control}
            name="companyUuid"
            render={({ field }) => (
              <SearchSelect
                id="companyUuid"
                value={field.value || ""}
                options={companyOptions}
                onValueChange={handleCompanyChange}
                invalid={!!errors.companyUuid}
              />
            )}
          />
          <FormFieldError message={errors.companyUuid?.message} />
        </div>

        <FormSelectField
          control={control}
          id="contactUuid"
          name="contactUuid"
          label="Contact"
          options={contactOptions}
          emptyValue=""
          disabled={contactOptions.length <= 1}
        />

        <div>
          <FormLabel htmlFor="customerRef">Customer ref.</FormLabel>
          <Input id="customerRef" {...register("customerRef")} />
          <label className="mt-1 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" {...register("leaveCustomerRef")} />
            Leave customer ref.
          </label>
        </div>

        <div>
          <FormLabel htmlFor="ourReference">Our reference</FormLabel>
          <Input id="ourReference" {...register("ourReference")} />
        </div>

        <FormSelectField
          control={control}
          id="requestMethod"
          name="requestMethod"
          label="Order method"
          options={requestMethodOptions}
          emptyValue=""
        />

        <FormSelectField
          control={control}
          id="seller"
          name="seller"
          label="Seller"
          options={clerkUsers}
          emptyValue=""
        />

        <div>
          <FormLabel htmlFor="priceDate">Price date</FormLabel>
          <Controller
            name="priceDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="priceDate"
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <FormSelectField
          control={control}
          id="projectUuid"
          name="projectUuid"
          label="Project"
          options={projectOptions}
          emptyValue=""
          disabled={projectOptions.length <= 1}
        />

        <FormSelectField
          control={control}
          id="contractUuid"
          name="contractUuid"
          label="Contract"
          options={contractOptions}
          emptyValue=""
        />

        {/* No column holds a quote's category yet, so it is shown greyed. */}
        <div>
          <FormLabel htmlFor="orderCategory">Order category</FormLabel>
          <Select
            id="orderCategory"
            options={[{ value: "", label: "-empty-" }]}
            value=""
            disabled
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 self-end pb-1 text-sm">
          <input type="checkbox" {...register("handlingBlocked")} />
          Handling blocked
        </label>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold">Validity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="quoteDate">Quote date</FormLabel>
            <Controller
              name="quoteDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="quoteDate"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled
                />
              )}
            />
          </div>

          <div>
            <FormLabel htmlFor="validityPeriodDays">
              Validity period (calendar days)
            </FormLabel>
            <Input
              id="validityPeriodDays"
              type="number"
              min={0}
              {...register("validityPeriodDays")}
            />
          </div>

          <div>
            <FormLabel htmlFor="validUntil">Valid u/i</FormLabel>
            <Controller
              name="validUntil"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="validUntil"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled
                />
              )}
            />
          </div>

          <div>
            <FormLabel htmlFor="decisionDate">Decision date</FormLabel>
            <Controller
              name="decisionDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="decisionDate"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 self-end pb-1 text-sm">
            <input type="checkbox" {...register("expired")} />
            Expired
          </label>

          {/* Free text: the one expiry reason the reference holds reads
              "Customer not accepted - price." */}
          <div>
            <FormLabel htmlFor="expirationReason">Expiration reason</FormLabel>
            <Input
              id="expirationReason"
              disabled={!expired}
              {...register("expirationReason")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
