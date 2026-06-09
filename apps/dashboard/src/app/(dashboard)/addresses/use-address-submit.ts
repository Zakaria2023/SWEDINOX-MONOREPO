"use client";

import type { InsertCompanyAddresses } from "@/db";
import type { AvailableAt } from "@/lib/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  createAddress,
  updateAddress,
  type AddressActionResult,
  type UpdateAddressInput,
} from "./actions";
import { addressSchema, type AddressFormValues } from "./validation";

type AddressFormMode = "add" | "edit";

type UseAddressSubmitOptions = {
  addressId?: number;
  companyUuid?: string;
  mode?: AddressFormMode;
  onSuccess?: (state: AddressActionResult) => void | Promise<void>;
};

export const useAddressSubmit = ({
  addressId,
  companyUuid,
  mode = "add",
  onSuccess,
}: UseAddressSubmitOptions = {}) => {
  const router = useRouter();
  const [state, setState] = useState<AddressActionResult>({});
  const [isPending, setIsPending] = useState(false);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      companyUuid: companyUuid ?? "",
      category: [],
      availableAt: "",
      billingAttention: "",
      billingAttentionAdditional: "",
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

  const persistAddress = async (
    payload: InsertCompanyAddresses | UpdateAddressInput,
  ) => {
    setIsPending(true);

    try {
      const nextState =
        mode === "edit" && addressId
          ? await updateAddress({}, payload as UpdateAddressInput)
          : await createAddress({}, payload as InsertCompanyAddresses);

      setState(nextState);

      if (!nextState.success) {
        return nextState;
      }

      if (onSuccess) {
        await onSuccess(nextState);
      } else {
        router.push("/addresses");
      }

      return nextState;
    } catch (error) {
      console.error("Failed to persist address", error);

      const nextState: AddressActionResult = {
        error: "Unable to save address right now.",
      };
      setState(nextState);
      return nextState;
    } finally {
      setIsPending(false);
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    const payload = {
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
    };

    if (mode === "edit" && addressId) {
      await persistAddress({
        ...payload,
        id: addressId,
      } as UpdateAddressInput);
      return;
    }

    await persistAddress(payload as InsertCompanyAddresses);
  });

  return { form, onSubmit, isPending, state };
};
