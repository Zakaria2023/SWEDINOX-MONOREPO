"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  createCompany,
  updateCompany,
  type CompanyActionResult,
  type CreateCompanyInput,
} from "./actions";
import { companySchema, type CompanyFormValues } from "./validation";

type CompanyFormMode = "add" | "edit";

type UseCompanySubmitOptions = {
  companyId?: number;
  mode?: CompanyFormMode;
  onSuccess?: (state: CompanyActionResult) => void | Promise<void>;
};

export const useCompanySubmit = ({
  companyId,
  mode = "add",
  onSuccess,
}: UseCompanySubmitOptions = {}) => {
  const router = useRouter();
  const [state, setState] = useState<CompanyActionResult>({});
  const [isPending, setIsPending] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      addressId: "",
      companyName: "",
    },
  });

  const persistCompany = async (input: CreateCompanyInput) => {
    setIsPending(true);

    try {
      const nextState: CompanyActionResult =
        mode === "edit" && companyId
          ? await updateCompany({}, { id: companyId, ...input })
          : await createCompany({}, input);

      setState(nextState);

      return nextState;
    } catch (error) {
      console.error("Failed to persist company", error);

      const nextState: CompanyActionResult = {
        error: "Unable to save company right now.",
      };
      setState(nextState);
      return nextState;
    } finally {
      setIsPending(false);
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    const nextState = await persistCompany({
      companyName: data.companyName,
      addressId: data.addressId ? parseInt(data.addressId, 10) : undefined,
    });

    if (!nextState.success) {
      return;
    }

    if (onSuccess) {
      void onSuccess(nextState);
      return;
    }

    router.push("/companies");
  });

  return {
    form,
    isPending,
    onSubmit,
    state,
  };
};
