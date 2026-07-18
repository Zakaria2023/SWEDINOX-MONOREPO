"use client";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { DialogFormFooter } from "@/components/ui/dialog-form-footer";
import { FormLabel } from "@/components/ui/form-field";
import {
  deliveryTerms,
  invoicePaymentTerms,
  orderMethods,
  orderWeightTypes,
  salesRepresentatives,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  DELIVERY_TERM_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_METHOD_LABELS,
  ORDER_WEIGHT_TYPE_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";
import { FileText } from "lucide-react";
import { FormEventHandler } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { QuoteDialogValues } from "@/app/(dashboard)/companies/validation";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<QuoteDialogValues>;
  isEditing?: boolean;
};

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

const CheckboxField = ({ label, checked, onChange }: CheckboxFieldProps) => (
  <label className="flex cursor-pointer items-center gap-2">
    <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

export const QuoteDialog = ({
  isOpen,
  onOpenChange,
  onCancel,
  onSave,
  form,
  isEditing = false,
}: Props) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="flex max-h-[85dvh] max-w-2xl flex-col gap-0 p-0">
      <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
        <DialogTitle className="flex items-center gap-2">
          <FileText className="size-4" />
          {isEditing ? "Edit Quote" : "Add Quote"}
        </DialogTitle>
        <DialogDescription>
          Add a quote for this company.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSave} className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="q-quote-date">Quote date</FormLabel>
              <Controller
                name="quoteDate"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor="q-decision-date">Decision date</FormLabel>
              <Controller
                name="decisionDate"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <FormLabel htmlFor="q-price-date">Price date</FormLabel>
              <Controller
                name="priceDate"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor="q-valid-until">Valid until</FormLabel>
              <Controller
                name="validUntil"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor="q-validity-days">Validity (days)</FormLabel>
              <Input
                id="q-validity-days"
                type="number"
                min="0"
                {...form.register("validityPeriodDays")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="q-request-method">Request method</FormLabel>
              <Controller
                name="requestMethod"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="q-request-method"
                    options={[
                      { value: "", label: COMMON_TEXT.emptyOption },
                      ...orderMethods.map((method) => ({
                        value: method,
                        label: ORDER_METHOD_LABELS[method],
                      })),
                    ]}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={COMMON_TEXT.selectOption}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor="q-seller">Seller</FormLabel>
              <Controller
                name="seller"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="q-seller"
                    options={[
                      { value: "", label: COMMON_TEXT.emptyOption },
                      ...salesRepresentatives.map((rep) => ({
                        value: rep,
                        label: SALES_REPRESENTATIVE_LABELS[rep],
                      })),
                    ]}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={COMMON_TEXT.selectOption}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="q-customer-ref">Customer reference</FormLabel>
              <Input
                id="q-customer-ref"
                {...form.register("customerRef")}
                placeholder="Customer reference"
              />
            </div>
            <div>
              <FormLabel htmlFor="q-our-ref">Our reference</FormLabel>
              <Input
                id="q-our-ref"
                {...form.register("ourReference")}
                placeholder="Our reference"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <FormLabel htmlFor="q-weight-type">Weight type</FormLabel>
              <Controller
                name="weightType"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="q-weight-type"
                    options={[
                      { value: "", label: COMMON_TEXT.emptyOption },
                      ...orderWeightTypes.map((type) => ({
                        value: type,
                        label: ORDER_WEIGHT_TYPE_LABELS[type],
                      })),
                    ]}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={COMMON_TEXT.selectOption}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor="q-delivery-terms">Delivery terms</FormLabel>
              <Controller
                name="deliveryTerms"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="q-delivery-terms"
                    options={[
                      { value: "", label: COMMON_TEXT.emptyOption },
                      ...deliveryTerms.map((term) => ({
                        value: term,
                        label: DELIVERY_TERM_LABELS[term],
                      })),
                    ]}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={COMMON_TEXT.selectOption}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor="q-payment-terms">Payment terms</FormLabel>
              <Controller
                name="paymentTerms"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="q-payment-terms"
                    options={[
                      { value: "", label: COMMON_TEXT.emptyOption },
                      ...invoicePaymentTerms.map((term) => ({
                        value: term,
                        label: INVOICE_PAYMENT_TERM_LABELS[term],
                      })),
                    ]}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={COMMON_TEXT.selectOption}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="q-amount">Amount (excl. VAT)</FormLabel>
              <Input
                id="q-amount"
                inputMode="decimal"
                {...form.register("totalExclVat")}
              />
            </div>
            <div>
              <FormLabel htmlFor="q-weight">Weight (kg)</FormLabel>
              <Input
                id="q-weight"
                inputMode="decimal"
                {...form.register("totalWeightKg")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Controller
              name="isPickup"
              control={form.control}
              render={({ field }) => (
                <CheckboxField
                  label="Pick-up"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="isIncidental"
              control={form.control}
              render={({ field }) => (
                <CheckboxField
                  label="Incidental"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="isConsignment"
              control={form.control}
              render={({ field }) => (
                <CheckboxField
                  label="Consignment"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="isOverlengte"
              control={form.control}
              render={({ field }) => (
                <CheckboxField
                  label="Overlength"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="handlingBlocked"
              control={form.control}
              render={({ field }) => (
                <CheckboxField
                  label="Handling blocked"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div>
            <FormLabel htmlFor="q-remarks">Remarks</FormLabel>
            <Textarea id="q-remarks" {...form.register("remarks")} />
          </div>

          <div>
            <FormLabel htmlFor="q-days">Days in system</FormLabel>
            <Input id="q-days" value="0" readOnly disabled />
          </div>
        </DialogBody>
        <DialogFormFooter
          onCancel={onCancel}
          submitLabel={isEditing ? "Save Quote" : "Add Quote"}
        />
      </form>
    </DialogContent>
  </Dialog>
);
