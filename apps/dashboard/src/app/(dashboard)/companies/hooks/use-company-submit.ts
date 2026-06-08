"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCompany, type CreateCompanyInput } from "../actions";
import { companySchema, type CompanyFormValues } from "../schema";

export const useCompanySubmit = () => {
  const router = useRouter();
  const [state, dispatch, isPending] = useActionState(createCompany, {});
  const [addressAction, setAddressAction] = useState<"none" | "add_address">(
    "none",
  );

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      addressAction: "none",
      companyName: "",
    },
  });

  useEffect(() => {
    if (!state.success) {
      return;
    }

    if (addressAction === "add_address" && state.companyUuid) {
      router.push(`/addresses/add?companyUuid=${state.companyUuid}`);
      return;
    }

    router.push("/companies");
  }, [addressAction, router, state.companyUuid, state.success]);

  const onSubmit = form.handleSubmit((data) => {
    setAddressAction(data.addressAction);
    dispatch({
      companyName: data.companyName,
    } as CreateCompanyInput);
  });

  return { form, isPending, onSubmit, state };
};
