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
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { returnOrderReasons, returnOrderStatuses } from "@/lib/enums";
import {
  RETURN_ORDER_REASON_LABELS,
  RETURN_ORDER_STATUS_LABELS,
} from "@/lib/labels";
import { Undo2 } from "lucide-react";
import { FormEventHandler } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { ReturnOrderDialogValues } from "@/app/(dashboard)/companies/validation";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<ReturnOrderDialogValues>;
  isEditing?: boolean;
};

export const ReturnOrderDialog = ({
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
          <Undo2 className="size-4" />
          {isEditing ? "Edit Return" : "Add Return"}
        </DialogTitle>
        <DialogDescription>
          Add a customer return order for this company.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSave} className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="ro-order">Order</FormLabel>
              <Input
                id="ro-order"
                {...form.register("orderReference")}
                placeholder="Order reference"
              />
            </div>
            <div>
              <FormLabel htmlFor="ro-order-date">Order date</FormLabel>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="ro-customer-ref">Customer reference</FormLabel>
              <Input
                id="ro-customer-ref"
                {...form.register("customerRef")}
                placeholder="Customer reference"
              />
            </div>
            <div>
              <FormLabel htmlFor="ro-our-ref">Our reference</FormLabel>
              <Input
                id="ro-our-ref"
                {...form.register("ourReference")}
                placeholder="Our reference"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="ro-status">Status</FormLabel>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="ro-status"
                    options={returnOrderStatuses.map((status) => ({
                      value: status,
                      label: RETURN_ORDER_STATUS_LABELS[status],
                    }))}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor="ro-reason" required>
                Return reason
              </FormLabel>
              <Controller
                name="returnReason"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="ro-reason"
                    options={[
                      { value: "", label: "Select reason" },
                      ...returnOrderReasons.map((reason) => ({
                        value: reason,
                        label: RETURN_ORDER_REASON_LABELS[reason],
                      })),
                    ]}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder="Select reason"
                  />
                )}
              />
              <FormFieldError
                message={form.formState.errors.returnReason?.message}
              />
            </div>
          </div>

          <div>
            <FormLabel htmlFor="ro-complaint">Complaint</FormLabel>
            <Input
              id="ro-complaint"
              {...form.register("complaintRef")}
              placeholder="Complaint reference"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="ro-weight">Weight (kg)</FormLabel>
              <Input
                id="ro-weight"
                inputMode="decimal"
                {...form.register("totalWeightKg")}
              />
            </div>
            <div>
              <FormLabel htmlFor="ro-amount">Amount (excl. VAT)</FormLabel>
              <Input
                id="ro-amount"
                inputMode="decimal"
                {...form.register("totalExclVat")}
              />
            </div>
          </div>

          <Controller
            name="handlingBlocked"
            control={form.control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                <span className="text-sm text-gray-700">Handling blocked</span>
              </label>
            )}
          />

          <div>
            <FormLabel htmlFor="ro-remarks">Remarks</FormLabel>
            <Textarea id="ro-remarks" {...form.register("remarks")} />
          </div>

          <div>
            <FormLabel htmlFor="ro-days">Days in system</FormLabel>
            <Input id="ro-days" value="0" readOnly disabled />
          </div>
        </DialogBody>
        <DialogFormFooter
          onCancel={onCancel}
          submitLabel={isEditing ? "Save Return" : "Add Return"}
        />
      </form>
    </DialogContent>
  </Dialog>
);
