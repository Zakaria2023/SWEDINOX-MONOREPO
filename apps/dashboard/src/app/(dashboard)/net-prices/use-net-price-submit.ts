"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createNetPrice,
  NetPriceActionResult,
  updateNetPrice,
} from "./actions";
import {
  DEFAULT_NET_PRICE,
  NetPriceFormValues,
  netPriceSchema,
} from "./validation";

type UseNetPriceSubmitParams = {
  /** Set when editing an existing price; omitted when agreeing a new one. */
  netPriceUuid?: string;
  defaultValues?: NetPriceFormValues;
};

export const useNetPriceSubmit = ({
  netPriceUuid,
  defaultValues,
}: UseNetPriceSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<NetPriceActionResult>({});

  const form = useForm<NetPriceFormValues>({
    resolver: zodResolver(netPriceSchema),
    defaultValues: defaultValues ?? DEFAULT_NET_PRICE,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const input = {
        contractUuid: values.contractUuid,
        productUuid: values.productUuid,
        netPrice: values.netPrice,
        netPriceUnit: values.netPriceUnit,
        fromQty: values.fromQty || "0",
        fromQtyUnit: values.fromQtyUnit,
        validFrom: values.validFrom || null,
        validUntil: values.validUntil || null,
      };

      // Both actions redirect on success, so only a refusal comes back.
      setState(
        netPriceUuid
          ? await updateNetPrice(netPriceUuid, input)
          : await createNetPrice(input),
      );
    });
  });

  const handleCancel = () =>
    router.push(netPriceUuid ? `/net-prices/${netPriceUuid}` : "/net-prices");

  return {
    form,
    isPending,
    isEditing: Boolean(netPriceUuid),
    onSubmit,
    state,
    handleCancel,
  };
};
