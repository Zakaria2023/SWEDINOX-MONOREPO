"use client";

import { CompanyFormValues } from "@/app/(dashboard)/companies/validation";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { invoiceFrequencies, invoicingMethods } from "@/lib/enums";
import {
  INVOICE_FREQUENCY_LABELS,
  INVOICING_METHOD_LABELS,
} from "@/lib/labels";
import { useFormContext } from "react-hook-form";

type Props = {
  isPending: boolean;
};

export const InvoicesSection = ({ isPending }: Props) => {
  const {
    control,
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<CompanyFormValues>();

  const invoicingMethodOptions = invoicingMethods.map((method) => ({
    value: method,
    label: INVOICING_METHOD_LABELS[method],
  }));

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
        Invoicing
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Method + flags */}
        <div className="space-y-3">
          <FormSelectField
            control={control}
            name="invoicingMethod"
            id="invoicingMethod"
            label="Invoicing method"
            options={invoicingMethodOptions}
            disabled={isPending}
          />

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={watch("collectiveInvoicing")}
              onChange={() =>
                setValue(
                  "collectiveInvoicing",
                  !getValues("collectiveInvoicing"),
                )
              }
              disabled={isPending}
            />
            Collective invoicing
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={watch("invoicePackagingAtZeroPrice")}
              onChange={() =>
                setValue(
                  "invoicePackagingAtZeroPrice",
                  !getValues("invoicePackagingAtZeroPrice"),
                )
              }
              disabled={isPending}
            />
            Invoice packaging at zero price
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={watch("printCommodityCode")}
              onChange={() =>
                setValue("printCommodityCode", !getValues("printCommodityCode"))
              }
              disabled={isPending}
            />
            Print commodity code
          </label>
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <FormLabel>Frequency of sending invoices</FormLabel>
          <div className="space-y-2">
            {invoiceFrequencies.map((frequency) => (
              <label
                key={frequency}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="invoiceFrequency"
                  className="size-4 accent-primary"
                  checked={watch("invoiceFrequency") === frequency}
                  onChange={() => setValue("invoiceFrequency", frequency)}
                  disabled={isPending}
                />
                {INVOICE_FREQUENCY_LABELS[frequency]}
              </label>
            ))}
          </div>
        </div>

        {/* Actions when sending invoice */}
        <div className="space-y-3">
          <FormLabel>Actions when sending invoice</FormLabel>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={watch("invoicePrintEnabled")}
                onChange={() =>
                  setValue(
                    "invoicePrintEnabled",
                    !getValues("invoicePrintEnabled"),
                  )
                }
                disabled={isPending}
              />
              Print, number of prints:
            </label>
            <Input
              id="invoicePrintCount"
              type="number"
              min={1}
              className="w-20"
              {...register("invoicePrintCount", { valueAsNumber: true })}
              disabled={isPending || !watch("invoicePrintEnabled")}
            />
          </div>
          <FormFieldError message={errors.invoicePrintCount?.message} />

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={watch("invoiceEmailEnabled")}
                onChange={() =>
                  setValue(
                    "invoiceEmailEnabled",
                    !getValues("invoiceEmailEnabled"),
                  )
                }
                disabled={isPending}
              />
              E-mailing to:
            </label>
            <Input
              id="invoiceEmailTo"
              type="email"
              placeholder="Email address"
              {...register("invoiceEmailTo")}
              disabled={isPending || !watch("invoiceEmailEnabled")}
            />
            <FormFieldError message={errors.invoiceEmailTo?.message} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={watch("printEmailZeroValueInvoices")}
              onChange={() =>
                setValue(
                  "printEmailZeroValueInvoices",
                  !getValues("printEmailZeroValueInvoices"),
                )
              }
              disabled={isPending}
            />
            Also print/e-mail zero-value invoices
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={watch("sendXmlWithInvoice")}
              onChange={() =>
                setValue("sendXmlWithInvoice", !getValues("sendXmlWithInvoice"))
              }
              disabled={isPending}
            />
            Send XML with invoice
          </label>
        </div>
      </div>
    </section>
  );
};
