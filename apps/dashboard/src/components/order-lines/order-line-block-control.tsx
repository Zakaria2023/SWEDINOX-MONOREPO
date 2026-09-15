"use client";

import { blockOrderLineDelivery } from "@/app/(dashboard)/deliveries/actions";
import { OrderLineDetail } from "@/app/(dashboard)/order-lines/actions";
import {
  blockDeliverySchema,
  BlockDeliveryFormValues,
} from "@/app/(dashboard)/deliveries/validation";
import { ReleaseCommercialButton } from "@/components/deliveries/blocked-deliveries-table-content";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  orderItemUuid: OrderLineDetail["uuid"];
  orderUuid: OrderLineDetail["orderUuid"];
  status: OrderLineDetail["status"];
  commercialBlock: OrderLineDetail["commercialBlock"];
};

// Hold or release this line's delivery. A held line shows the release, which
// covers the whole order as in the reference; a reserved line not yet held can
// be held with a reason. A line that has shipped offers neither.
export const OrderLineBlockControl = ({
  orderItemUuid,
  orderUuid,
  status,
  commercialBlock,
}: Props) => {
  const [state, dispatch, isPending] = useActionState(
    blockOrderLineDelivery,
    {},
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BlockDeliveryFormValues>({
    resolver: zodResolver(blockDeliverySchema),
    defaultValues: { reason: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, orderItemUuid });
    });
  });

  if (commercialBlock) {
    return (
      <section className="space-y-2 rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">
          This line&rsquo;s delivery is on a commercial block.
        </p>
        <ReleaseCommercialButton orderUuid={orderUuid} />
      </section>
    );
  }

  if (status !== "reserved") {
    return null;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-border p-4"
    >
      <FormError>{state.error}</FormError>
      <div className="space-y-2">
        <FormLabel htmlFor="blockReason">Block this delivery</FormLabel>
        <div className="flex flex-wrap gap-3">
          <Input
            id="blockReason"
            className="max-w-md"
            placeholder="Reason"
            {...register("reason")}
            disabled={isPending}
          />
          <Button type="submit" variant="outline" disabled={isPending}>
            {isPending ? "Blocking..." : "Block delivery"}
          </Button>
        </div>
        <FormFieldError message={errors.reason?.message} />
      </div>
    </form>
  );
};
