"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { OrderDetail, updateOrder } from "@/app/(dashboard)/orders/actions";
import { Button } from "@/components/shadcn/button";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { FormError } from "@/components/ui/form-error";
import { FormLabel } from "@/components/ui/form-field";
import { COMMON_TEXT } from "@/lib/labels";

const editSchema = z.object({
  customerRef: z.string().optional(),
  ourReference: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliveryRemark: z.string().optional(),
  remarks: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

const toDateInput = (value: Date | string | null) => {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().split("T")[0];
};

type Props = {
  order: OrderDetail;
};

export const OrderEditForm = ({ order }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const { register, control, handleSubmit } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      customerRef: order.customerRef ?? "",
      ourReference: order.ourReference ?? "",
      deliveryDate: toDateInput(order.deliveryDate),
      deliveryRemark: order.deliveryRemark ?? "",
      remarks: order.remarks ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateOrder(order.uuid, {
        customerRef: values.customerRef || null,
        ourReference: values.ourReference || null,
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
          <FormLabel htmlFor="customerRef">Customer Ref</FormLabel>
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
          onClick={() => router.push(`/orders/${order.uuid}`)}
          disabled={isPending}
        >
          {COMMON_TEXT.cancel}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? COMMON_TEXT.saving : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};
