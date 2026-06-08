"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCompany, type CreateCompanyInput } from "../actions";
import { companySchema, type CompanyFormValues } from "../schema";

export const useCompanySubmit = () => {
  const router = useRouter();
  const [state, dispatch, isPending] = useActionState(createCompany, {});

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "",
    },
  });

  useEffect(() => {
    if (state.success) router.push("/companies");
  }, [state.success, router]);

  const onSubmit = form.handleSubmit((data) => {
    dispatch(data as CreateCompanyInput);
  });

  return { form, isPending, onSubmit, state };
};
