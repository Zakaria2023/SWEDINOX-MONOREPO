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
import { purchaseOrderStatuses, purchaseOrderTypes } from "@/lib/enums";
import { PURCHASE_ORDER_STATUS_LABELS, PURCHASE_ORDER_TYPE_LABELS } from "@/lib/labels";
import { PackageCheck } from "lucide-react";
import { FormEventHandler } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { PurchaseOrderDialogValues } from "@/app/(dashboard)/companies/validation";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<PurchaseOrderDialogValues>;
  isEditing?: boolean;
};

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

type DateFieldProps = {
  id: string;
  label: string;
  form: UseFormReturn<PurchaseOrderDialogValues>;
  name: "orderDate" | "deliveryDate" | "confirmationDate";
};

type TextFieldProps = {
  id: string;
  label: string;
  form: UseFormReturn<PurchaseOrderDialogValues>;
  name:
    | "forOrder"
    | "amount"
    | "weightKg"
    | "confirmationReference"
    | "copiedFrom"
    | "internalReference"
    | "reference"
    | "inkoper"
    | "purchaserInitials";
  inputMode?: "decimal";
};

const CheckboxField = ({ label, checked, onChange }: CheckboxFieldProps) => (
  <label className="flex cursor-pointer items-center gap-2">
    <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

const DateField = ({ id, label, form, name }: DateFieldProps) => (
  <div>
    <FormLabel htmlFor={id}>{label}</FormLabel>
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <DatePicker value={field.value ?? ""} onChange={field.onChange} />
      )}
    />
  </div>
);

const TextField = ({ id, label, form, name, inputMode }: TextFieldProps) => (
  <div>
    <FormLabel htmlFor={id}>{label}</FormLabel>
    <Input id={id} inputMode={inputMode} {...form.register(name)} />
  </div>
);

export const PurchaseOrderDialog = ({
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
          <PackageCheck className="size-4" />
          {isEditing ? "Edit Purchase Order" : "Add Purchase Order"}
        </DialogTitle>
        <DialogDescription>
          Add a purchase order placed with this company.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSave} className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="po-status">Status</FormLabel>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="po-status"
                    options={purchaseOrderStatuses.map((status) => ({
                      value: status,
                      label: PURCHASE_ORDER_STATUS_LABELS[status],
                    }))}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor="po-type">Purchase type</FormLabel>
              <Controller
                name="purchaseOrderType"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="po-type"
                    options={[
                      { value: "", label: "Empty" },
                      ...purchaseOrderTypes.map((type) => ({
                        value: type,
                        label: PURCHASE_ORDER_TYPE_LABELS[type],
                      })),
                    ]}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder="Select"
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateField
              id="po-order-date"
              label="Order date"
              form={form}
              name="orderDate"
            />
            <DateField
              id="po-delivery-date"
              label="Delivery date"
              form={form}
              name="deliveryDate"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="po-for-order"
              label="For order"
              form={form}
              name="forOrder"
            />
            <TextField
              id="po-reference"
              label="Reference"
              form={form}
              name="reference"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="po-amount"
              label="Amount"
              form={form}
              name="amount"
              inputMode="decimal"
            />
            <TextField
              id="po-weight"
              label="Weight (kg)"
              form={form}
              name="weightKg"
              inputMode="decimal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="po-confirmation-ref"
              label="Confirmation reference"
              form={form}
              name="confirmationReference"
            />
            <DateField
              id="po-confirmation-date"
              label="Confirmation date"
              form={form}
              name="confirmationDate"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="po-copied-from"
              label="Copied from"
              form={form}
              name="copiedFrom"
            />
            <TextField
              id="po-internal-ref"
              label="Internal reference"
              form={form}
              name="internalReference"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="po-inkoper"
              label="Inkoper"
              form={form}
              name="inkoper"
            />
            <TextField
              id="po-purchaser-initials"
              label="Purchaser initials"
              form={form}
              name="purchaserInitials"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Controller
              name="isPrinted"
              control={form.control}
              render={({ field }) => (
                <CheckboxField
                  label="Printed"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="isMailed"
              control={form.control}
              render={({ field }) => (
                <CheckboxField
                  label="Mailed"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="arrangeTransport"
              control={form.control}
              render={({ field }) => (
                <CheckboxField
                  label="Handle transport"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="pickupDropoffCdPurchases"
              control={form.control}
              render={({ field }) => (
                <CheckboxField
                  label="Pick up/Drop off"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="isOverlength"
              control={form.control}
              render={({ field }) => (
                <CheckboxField
                  label="Overlength"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div>
            <FormLabel htmlFor="po-remarks">Remarks</FormLabel>
            <Textarea id="po-remarks" {...form.register("remarks")} />
          </div>

          <div>
            <FormLabel htmlFor="po-days">Days in system</FormLabel>
            <Input id="po-days" value="0" readOnly disabled />
          </div>
        </DialogBody>
        <DialogFormFooter
          onCancel={onCancel}
          submitLabel={isEditing ? "Save Purchase Order" : "Add Purchase Order"}
        />
      </form>
    </DialogContent>
  </Dialog>
);
