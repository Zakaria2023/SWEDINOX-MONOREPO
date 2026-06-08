"use client";

import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { AvailableAt } from "@/lib/enums";
import {
  createAddress,
  type AddressActionResult,
  type CreateAddressInput,
} from "../actions";
import { addressSchema, type AddressFormValues } from "../schema";

type UseAddressSubmitOptions = {
  companyUuid?: string;
  onSuccess?: (state: AddressActionResult) => void | Promise<void>;
};

export const useAddressSubmit = ({
  companyUuid,
  onSuccess,
}: UseAddressSubmitOptions = {}) => {
  const router = useRouter();
  const [state, dispatch, isPending] = useActionState(createAddress, {});

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      companyUuid: companyUuid ?? "",
      category: [],
      availableAt: "",
      poBox: false,
      needCrane: false,
      canopyRequired: false,
      bundleSeparately: false,
      addressComplete: false,
      specialTransport: false,
      unloadingStartTime: "",
      unloadingEndTime: "",
    },
  });

  useEffect(() => {
    if (!state.success) {
      return;
    }

    if (onSuccess) {
      void onSuccess(state);
      return;
    }

    router.push("/addresses");
  }, [onSuccess, router, state]);

  const onSubmit = form.handleSubmit((data) => {
    dispatch({
      ...data,
      email: data.email || undefined,
      website: data.website || undefined,
      sequenceNumber: data.sequenceNumber
        ? parseInt(data.sequenceNumber, 10)
        : undefined,
      availableAt: data.availableAt
        ? (data.availableAt as AvailableAt)
        : undefined,
      unloadingStartTime: data.unloadingStartTime || undefined,
      unloadingEndTime: data.unloadingEndTime || undefined,
    } as CreateAddressInput);
  });

  return { form, onSubmit, isPending, state };
};
