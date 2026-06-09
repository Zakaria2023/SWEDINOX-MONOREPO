"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  createCompany,
  updateCompany,
  type CompanyActionResult,
  type CreateCompanyInput,
} from "./actions";
import { companySchema, type CompanyFormValues } from "./schema";

type CompanyFormMode = "add" | "edit";

type UseCompanySubmitOptions = {
  companyId?: number;
  companyUuid?: string;
  mode?: CompanyFormMode;
  onSuccess?: (state: CompanyActionResult) => void | Promise<void>;
};

export const useCompanySubmit = ({
  companyId,
  companyUuid: initialCompanyUuid,
  mode = "add",
  onSuccess,
}: UseCompanySubmitOptions = {}) => {
  const router = useRouter();
  const [state, setState] = useState<CompanyActionResult>({});
  const [companyUuid, setCompanyUuid] = useState<string | undefined>(
    initialCompanyUuid,
  );
  const [isPending, setIsPending] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      addressId: "",
      companyName: "",
    },
  });

  useEffect(() => {
    if (initialCompanyUuid) {
      setCompanyUuid(initialCompanyUuid);
    }
  }, [initialCompanyUuid]);

  const persistCompany = async (input: CreateCompanyInput) => {
    setIsPending(true);

    try {
      const nextState: CompanyActionResult =
        mode === "edit" && companyId
          ? await updateCompany({}, { id: companyId, ...input })
          : await createCompany({}, input);

      setState(nextState);

      if (nextState.success && nextState.companyUuid) {
        setCompanyUuid(nextState.companyUuid);
      }

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

  const ensureCompanyCreated = async () => {
    if (companyUuid) {
      return { companyUuid, success: true };
    }

    const isValid = await form.trigger("companyName");

    if (!isValid) {
      return { error: "Company name is required" };
    }

    const companyName = form.getValues("companyName").trim();
    return persistCompany({ companyName });
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (mode === "add" && companyUuid) {
      router.push("/companies");
      return;
    }

    const nextState = await persistCompany({
      companyName: data.companyName,
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
    companyUuid,
    ensureCompanyCreated,
    form,
    isPending,
    isPersisted: Boolean(companyUuid),
    onSubmit,
    setCompanyUuid,
    state,
  };
};
