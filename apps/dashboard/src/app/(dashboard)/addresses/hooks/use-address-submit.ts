"use client";

import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { AvailableAt } from "@/lib/enums";
import { createAddress, type CreateAddressInput } from "../actions";
import { addressSchema, type AddressFormValues } from "../schema";

export const useAddressSubmit = () => {
  const router = useRouter();
  const [state, dispatch, isPending] = useActionState(createAddress, {});

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      companyUuid: "",
      category: [],
      poBox: false,
      needCrane: false,
      canopyRequired: false,
      bundleSeparately: false,
      addressComplete: false,
      specialTransport: false,
    },
  });

  useEffect(() => {
    if (state.success) router.push("/addresses");
  }, [state.success, router]);

  const onSubmit = form.handleSubmit((data) => {
    dispatch({
      ...data,
      email: data.email || undefined,
      website: data.website || undefined,
      sequenceNumber: data.sequenceNumber
        ? parseInt(data.sequenceNumber, 10)
        : undefined,
      availableAt: (data.availableAt as AvailableAt) || undefined,
    } as CreateAddressInput);
  });

  return { form, onSubmit, isPending, state };
};
