"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, FormProvider } from "react-hook-form";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import {
  AddressOption,
  ContractOption,
  getAddressesByCompanyUuid,
  getContractsByCompanyUuid,
} from "@/app/(dashboard)/counter-orders/actions";
import { useCounterOrderSubmit } from "@/app/(dashboard)/counter-orders/use-counter-order-submit";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import {
  ContactOption,
  getContactsByCompanyUuid,
} from "@/app/(dashboard)/visit-reports/actions";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { ContractsSection } from "./sections/contracts-section";
import { DocumentsSection } from "./sections/documents-section";
import { FinancesSection } from "./sections/finances-section";
import { LogisticsSection } from "./sections/logistics-section";
import { SurchargesSection } from "./sections/surcharges-section";
import { TextsSection } from "./sections/texts-section";
import {
  counterOrderPriorities,
  counterOrderStatuses,
  deliveryTerms,
  orderMethods,
  salesRepresentatives,
} from "@/lib/enums";
import { COUNTER_ORDER_PRIORITY_LABELS, COUNTER_ORDER_STATUS_LABELS, DELIVERY_TERM_LABELS, ORDER_METHOD_LABELS, SALES_REPRESENTATIVE_LABELS } from "@/lib/labels";

type CounterOrderFormProps = {
  companies: CompanyOption[];
  textCategories: TextCategoryOption[];
};

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

const CheckboxField = ({
  label,
  checked,
  onChange,
  disabled,
}: CheckboxFieldProps) => (
  <label className="flex cursor-pointer items-center gap-2">
    <Checkbox
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

export const CounterOrderForm = ({
  companies,
  textCategories,
}: CounterOrderFormProps) => {
  const router = useRouter();
  const { form, isPending, onSubmit, state } = useCounterOrderSubmit();
  const { control, register } = form;

  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [contracts, setContracts] = useState<ContractOption[]>([]);

  const handleCompanyChange = async (
    value: string,
    fieldOnChange: (value: string) => void,
  ) => {
    fieldOnChange(value);
    form.setValue("contactUuid", "");
    form.setValue("deliveryAddressUuid", "");
    form.setValue("billingAddressUuid", "");
    form.setValue("contractUuids", []);
    setContacts([]);
    setAddresses([]);
    setContracts([]);

    if (value) {
      const [contactResult, addressResult, contractResult] = await Promise.all([
        getContactsByCompanyUuid(value),
        getAddressesByCompanyUuid(value),
        getContractsByCompanyUuid(value),
      ]);
      setContacts(contactResult);
      setAddresses(addressResult);
      setContracts(contractResult);
    }
  };

  const companyOptions = [
    { value: "", label: "Select an option" },
    ...companies.map((company) => ({
      value: company.uuid,
      label: [company.searchCode1, company.companyName]
        .filter(Boolean)
        .join(" - "),
    })),
  ];

  const contactOptions = [
    { value: "", label: "Empty" },
    ...contacts.map((contact) => ({
      value: contact.uuid,
      label:
        [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
        "Contact",
    })),
  ];

  const addressOptions = [
    { value: "", label: "Empty" },
    ...addresses.map((address) => ({
      value: address.uuid,
      label:
        [address.streetAndNo, address.postalCode, address.city]
          .filter(Boolean)
          .join(", ") || "Address",
    })),
  ];

  const orderMethodOptions = [
    { value: "", label: "Empty" },
    ...orderMethods.map((method) => ({
      value: method,
      label: ORDER_METHOD_LABELS[method],
    })),
  ];

  const sellerOptions = [
    { value: "", label: "Empty" },
    ...salesRepresentatives.map((rep) => ({
      value: rep,
      label: SALES_REPRESENTATIVE_LABELS[rep],
    })),
  ];

  const statusOptions = counterOrderStatuses.map((status) => ({
    value: status,
    label: COUNTER_ORDER_STATUS_LABELS[status],
  }));

  const priorityOptions = counterOrderPriorities.map((priority) => ({
    value: priority,
    label: COUNTER_ORDER_PRIORITY_LABELS[priority],
  }));

  const deliveryTermOptions = [
    { value: "", label: "Empty" },
    ...deliveryTerms.map((term) => ({
      value: term,
      label: DELIVERY_TERM_LABELS[term],
    })),
  ];

  const isPickup = form.watch("isPickup");

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        {/* Header */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            Counter Order
          </h2>
          <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-2">
            <FormSelectField
              control={control}
              id="companyUuid"
              name="companyUuid"
              label="Customer"
              options={companyOptions}
              emptyValue=""
              disabled={isPending}
              required
              errorMessage={form.formState.errors.companyUuid?.message}
              onValueChange={handleCompanyChange}
            />

            <FormSelectField
              control={control}
              id="contactUuid"
              name="contactUuid"
              label="Contact"
              options={contactOptions}
              emptyValue=""
              disabled={isPending || contacts.length === 0}
            />

            <div>
              <FormLabel htmlFor="customerRef">Customer ref.</FormLabel>
              <Input
                id="customerRef"
                {...register("customerRef")}
                disabled={isPending}
              />
            </div>

            <div>
              <FormLabel htmlFor="ourReference">Our reference</FormLabel>
              <Input
                id="ourReference"
                {...register("ourReference")}
                disabled={isPending}
              />
            </div>

            <FormSelectField
              control={control}
              id="orderMethod"
              name="orderMethod"
              label="Order method"
              options={orderMethodOptions}
              emptyValue=""
              disabled={isPending}
            />

            <FormSelectField
              control={control}
              id="seller"
              name="seller"
              label="Seller"
              options={sellerOptions}
              emptyValue=""
              disabled={isPending}
            />

            <FormSelectField
              control={control}
              id="status"
              name="status"
              label="Status"
              options={statusOptions}
              disabled={isPending}
            />

            <FormSelectField
              control={control}
              id="priority"
              name="priority"
              label="Priority"
              options={priorityOptions}
              disabled={isPending}
            />

            <div>
              <FormLabel htmlFor="orderDate">Order date</FormLabel>
              <Controller
                name="orderDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
            </div>

            <div>
              <FormLabel htmlFor="priceDate">Price date</FormLabel>
              <Controller
                name="priceDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
            </div>
          </div>
        </section>

        {/* Order type & flags */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            Order type
          </h2>
          <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <Controller
              name="isPickup"
              control={control}
              render={({ field }) => (
                <CheckboxField
                  label="Pick-up"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
            <Controller
              name="isIncidental"
              control={control}
              render={({ field }) => (
                <CheckboxField
                  label="Incidental"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
            <Controller
              name="isOverlength"
              control={control}
              render={({ field }) => (
                <CheckboxField
                  label="Overlength"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
            <Controller
              name="handlingBlocked"
              control={control}
              render={({ field }) => (
                <CheckboxField
                  label="Handling blocked"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
            <Controller
              name="printPickingSlips"
              control={control}
              render={({ field }) => (
                <CheckboxField
                  label="Print picking slips"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
            <Controller
              name="leaveCustomer"
              control={control}
              render={({ field }) => (
                <CheckboxField
                  label="Leave customer"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
            <Controller
              name="isPrinted"
              control={control}
              render={({ field }) => (
                <CheckboxField
                  label="Printed"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
            <Controller
              name="isMailed"
              control={control}
              render={({ field }) => (
                <CheckboxField
                  label="Mailed"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
            <Controller
              name="isFaxed"
              control={control}
              render={({ field }) => (
                <CheckboxField
                  label="Faxed"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
          </div>
        </section>

        {/* Delivery */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            Delivery
          </h2>
          <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-2">
            <FormSelectField
              control={control}
              id="deliveryTerms"
              name="deliveryTerms"
              label="Delivery terms"
              options={deliveryTermOptions}
              emptyValue=""
              disabled={isPending || isPickup}
            />

            <FormSelectField
              control={control}
              id="deliveryAddressUuid"
              name="deliveryAddressUuid"
              label="Delivery address"
              options={addressOptions}
              emptyValue=""
              disabled={isPending || isPickup || addresses.length === 0}
            />

            <div>
              <FormLabel htmlFor="deliveryDate">Delivery date</FormLabel>
              <Controller
                name="deliveryDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
            </div>

            <div>
              <FormLabel htmlFor="deliveryRemark">Delivery remark</FormLabel>
              <Input
                id="deliveryRemark"
                {...register("deliveryRemark")}
                disabled={isPending}
              />
            </div>
          </div>
        </section>

        <LogisticsSection />

        <FinancesSection addressOptions={addressOptions} />

        <SurchargesSection companyOptions={companyOptions} />

        <DocumentsSection />

        <ContractsSection contracts={contracts} />

        <TextsSection textCategories={textCategories} />

        {/* Summary */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            Summary
          </h2>
          <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-3">
            <div>
              <FormLabel htmlFor="amountExVat">Amount (ex VAT)</FormLabel>
              <Input
                id="amountExVat"
                inputMode="decimal"
                {...register("amountExVat")}
                disabled={isPending}
              />
            </div>
            <div>
              <FormLabel htmlFor="weightKg">Weight (kg)</FormLabel>
              <Input
                id="weightKg"
                inputMode="decimal"
                {...register("weightKg")}
                disabled={isPending}
              />
            </div>
            <div>
              <FormLabel htmlFor="gainPercent">Gain %</FormLabel>
              <Input
                id="gainPercent"
                inputMode="decimal"
                {...register("gainPercent")}
                disabled={isPending}
              />
            </div>
            <div className="md:col-span-3">
              <FormLabel htmlFor="remarks">Remarks</FormLabel>
              <Textarea
                id="remarks"
                {...register("remarks")}
                disabled={isPending}
              />
            </div>
          </div>
        </section>

        <FormError>{state.error}</FormError>

        <FormActions
          isPending={isPending}
          onCancel={() => router.push("/counter-orders")}
          submitLabel="Create Counter Order"
        />
      </form>
    </FormProvider>
  );
};
