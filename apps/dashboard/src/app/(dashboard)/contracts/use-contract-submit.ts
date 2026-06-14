"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createContract, type ContractActionResult, type ContractCompanyEntry } from "./actions";
import { createContractSchema, type ContractFormValues } from "./validation";

export const useContractSubmit = (companies: ContractCompanyEntry[]) => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ContractActionResult>({});

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(createContractSchema()),
    defaultValues: {
      code: "",
      contractType: undefined,
      description: "",
      contractGroupUuid: "",
      quicklyChangeOrder: "",
      hasPriceDate: false,
      priceDate: "",
      linkToNewCustomer: false,
      searchCode1: "",
      searchCode2: "",
      searchCode3: "",
      websiteSorting: "10",
      hideOnWebsite: false,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createContract(
        {
          code: values.code.toUpperCase(),
          contractType: values.contractType ?? null,
          description: values.description,
          contractGroupUuid: values.contractGroupUuid || undefined,
          quicklyChangeOrder: values.quicklyChangeOrder || undefined,
          hasPriceDate: values.hasPriceDate,
          priceDate: values.hasPriceDate && values.priceDate ? values.priceDate : undefined,
          linkToNewCustomer: values.linkToNewCustomer,
          searchCode1: values.searchCode1 || undefined,
          searchCode2: values.searchCode2 || undefined,
          searchCode3: values.searchCode3 || undefined,
          websiteSorting:
            values.websiteSorting !== "" && values.websiteSorting !== undefined
              ? Number(values.websiteSorting)
              : 10,
          hideOnWebsite: values.hideOnWebsite,
        },
        companies,
      );
      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
