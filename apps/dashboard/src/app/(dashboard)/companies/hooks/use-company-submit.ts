"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCompany,
  type CompanyActionResult,
  type CreateCompanyInput,
} from "../actions";
import { companySchema, type CompanyFormValues } from "../schema";

export const useCompanySubmit = () => {
  const router = useRouter();
  const [state, setState] = useState<CompanyActionResult>({});
  const [companyUuid, setCompanyUuid] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      addressId: "",
      companyName: "",
    },
  });

  const saveCompany = async (input: CreateCompanyInput) => {
    setIsPending(true);

    try {
      const nextState: CompanyActionResult = await createCompany({}, input);
      setState(nextState);

      if (nextState.success && nextState.companyUuid) {
        setCompanyUuid(nextState.companyUuid);
      }

      return nextState;
    } catch (error) {
      console.error("Failed to create company", error);

      const nextState: CompanyActionResult = {
        error: "Unable to create company right now.",
      };
      setState(nextState);
      return nextState;
    } finally {
      setIsPending(false);
    }
  };

  const ensureCompanyCreated = async () => {
    if (companyUuid) {
      return { companyUuid, success: true };
    }

    const isValid = await form.trigger("companyName");

    if (!isValid) {
      return { error: "Company name is required" };
    }

    const companyName = form.getValues("companyName").trim();
    return saveCompany({ companyName });
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (companyUuid) {
      router.push("/companies");
      return;
    }

    const nextState = await saveCompany({
      companyName: data.companyName,
    });

    if (!nextState.success) {
      return;
    }

    router.push("/companies");
  });

  return {
    companyUuid,
    ensureCompanyCreated,
    form,
    isPending,
    isSaved: Boolean(companyUuid),
    onSubmit,
    state,
  };
};
