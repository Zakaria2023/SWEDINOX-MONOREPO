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
  counterOrderPriorities,
  counterOrderStatuses,
  deliveryTerms,
  orderMethods,
  salesRepresentatives,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  COUNTER_ORDER_PRIORITY_LABELS,
  COUNTER_ORDER_STATUS_LABELS,
  DELIVERY_TERM_LABELS,
  ORDER_METHOD_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";
import { ShoppingCart } from "lucide-react";
import { FormEventHandler } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { CounterOrderDialogValues } from "@/app/(dashboard)/companies/validation";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<CounterOrderDialogValues>;
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

export const CounterOrderDialog = ({
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
          <ShoppingCart className="size-4" />
          {isEditing ? "Edit Counter Order" : "Add Counter Order"}
        </DialogTitle>
        <DialogDescription>
          Add an order taken at the counter for this company.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSave} className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="co-order-date">Order date</FormLabel>
              <Controller
                name="orderDate"
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
              <FormLabel htmlFor="co-delivery-date">Delivery date</FormLabel>
              <Controller
                name="deliveryDate"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="co-status">Status</FormLabel>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="co-status"
                    options={counterOrderStatuses.map((status) => ({
                      value: status,
                      label: COUNTER_ORDER_STATUS_LABELS[status],
                    }))}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor="co-priority">Priority</FormLabel>
              <Controller
                name="priority"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="co-priority"
                    options={counterOrderPriorities.map((priority) => ({
                      value: priority,
                      label: COUNTER_ORDER_PRIORITY_LABELS[priority],
                    }))}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="co-order-method">Order method</FormLabel>
              <Controller
                name="orderMethod"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="co-order-method"
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
              <FormLabel htmlFor="co-seller">Seller</FormLabel>
              <Controller
                name="seller"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="co-seller"
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
              <FormLabel htmlFor="co-customer-ref">Customer ref.</FormLabel>
              <Input
                id="co-customer-ref"
                {...form.register("customerRef")}
                placeholder="Customer reference"
              />
            </div>
            <div>
              <FormLabel htmlFor="co-our-ref">Our reference</FormLabel>
              <Input
                id="co-our-ref"
                {...form.register("ourReference")}
                placeholder="Our reference"
              />
            </div>
          </div>

          <div>
            <FormLabel htmlFor="co-delivery-terms">Delivery terms</FormLabel>
            <Controller
              name="deliveryTerms"
              control={form.control}
              render={({ field }) => (
                <Select
                  id="co-delivery-terms"
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <FormLabel htmlFor="co-amount">Amount (ex VAT)</FormLabel>
              <Input
                id="co-amount"
                inputMode="decimal"
                {...form.register("amountExVat")}
              />
            </div>
            <div>
              <FormLabel htmlFor="co-weight">Weight (kg)</FormLabel>
              <Input
                id="co-weight"
                inputMode="decimal"
                {...form.register("weightKg")}
              />
            </div>
            <div>
              <FormLabel htmlFor="co-gain">Gain %</FormLabel>
              <Input
                id="co-gain"
                inputMode="decimal"
                {...form.register("gainPercent")}
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
            <Controller
              name="printPickingSlips"
              control={form.control}
              render={({ field }) => (
                <CheckboxField
                  label="Print picking slips"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div>
            <FormLabel htmlFor="co-remarks">Remarks</FormLabel>
            <Textarea id="co-remarks" {...form.register("remarks")} />
          </div>

          <div>
            <FormLabel htmlFor="co-days">Days in system</FormLabel>
            <Input id="co-days" value="0" readOnly disabled />
          </div>
        </DialogBody>
        <DialogFormFooter
          onCancel={onCancel}
          submitLabel={isEditing ? "Save Counter Order" : "Add Counter Order"}
        />
      </form>
    </DialogContent>
  </Dialog>
);
