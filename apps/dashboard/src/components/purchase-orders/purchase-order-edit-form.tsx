"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toDateInput } from "@/lib/helpers";
import {
  PurchaseOrderDetail,
  updatePurchaseOrder,
} from "@/app/(dashboard)/purchase-orders/actions";
import { Button } from "@/components/shadcn/button";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { FormError } from "@/components/ui/form-error";
import { FormLabel } from "@/components/ui/form-field";
import { invoicePaymentTerms } from "@/lib/enums";
import { INVOICE_PAYMENT_TERM_LABELS } from "@/lib/labels";

const editSchema = z.object({
  reference: z.string().optional(),
  ourReference: z.string().optional(),
  orderCategory: z.string().optional(),
  paymentTerms: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliveryRemark: z.string().optional(),
  remarks: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

type Props = {
  purchaseOrder: PurchaseOrderDetail;
};

export const PurchaseOrderEditForm = ({ purchaseOrder }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const { register, control, handleSubmit } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      reference: purchaseOrder.reference ?? "",
      ourReference: purchaseOrder.ourReference ?? "",
      orderCategory: purchaseOrder.orderCategory ?? "",
      paymentTerms: purchaseOrder.paymentTerms ?? "",
      deliveryDate: toDateInput(purchaseOrder.deliveryDate),
      deliveryRemark: purchaseOrder.deliveryRemark ?? "",
      remarks: purchaseOrder.remarks ?? "",
    },
  });

  const paymentTermOptions = [
    { value: "", label: "Empty" },
    ...invoicePaymentTerms.map((t) => ({
      value: t,
      label: INVOICE_PAYMENT_TERM_LABELS[t],
    })),
  ];

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await updatePurchaseOrder(purchaseOrder.uuid, {
        reference: values.reference || null,
        ourReference: values.ourReference || null,
        orderCategory: values.orderCategory || null,
        paymentTerms:
          (values.paymentTerms || null) as PurchaseOrderDetail["paymentTerms"],
        deliveryDate: values.deliveryDate
          ? new Date(values.deliveryDate)
          : null,
        deliveryRemark: values.deliveryRemark || null,
        remarks: values.remarks || null,
      });

      if (result.error) {
        setError(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <FormError>{error}</FormError>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FormLabel htmlFor="reference">Reference</FormLabel>
          <Input id="reference" {...register("reference")} disabled={isPending} />
        </div>
        <div>
          <FormLabel htmlFor="ourReference">Our reference</FormLabel>
          <Input
            id="ourReference"
            {...register("ourReference")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="orderCategory">Order Category</FormLabel>
          <Input
            id="orderCategory"
            {...register("orderCategory")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="paymentTerms">Payment Terms</FormLabel>
          <Controller
            control={control}
            name="paymentTerms"
            render={({ field }) => (
              <Select
                id="paymentTerms"
                value={field.value ?? ""}
                options={paymentTermOptions}
                onValueChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
        </div>
        <div>
          <FormLabel htmlFor="deliveryDate">Delivery Date</FormLabel>
          <Controller
            control={control}
            name="deliveryDate"
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
          <FormLabel htmlFor="deliveryRemark">Delivery Remark</FormLabel>
          <Input
            id="deliveryRemark"
            {...register("deliveryRemark")}
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <FormLabel htmlFor="remarks">Remarks</FormLabel>
        <Textarea
          id="remarks"
          rows={4}
          {...register("remarks")}
          disabled={isPending}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/purchase-orders/${purchaseOrder.uuid}`)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};
