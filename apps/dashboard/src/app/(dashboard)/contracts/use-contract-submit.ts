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
      // Details
      grossPrice: false,
      grossPriceValue: "",
      colorSurcharge: false,
      colorSurchargeValue: "",
      colorSurchargeUnit: "",
      extraDiscount: false,
      extraDiscountValue: "",
      extraDiscountUnit: "",
      extraDiscountFromValue: "",
      extraDiscountFromUnit: "",
      quantitySurcharge: false,
      quantitySurchargeTierUnit: undefined,
      quantitySurchargeDiscountUnit: "",
      quantitySurchargeTiers: [],
      quantitySurchargePerType: undefined,
      lineDiscount: false,
      lineDiscountTierUnit: undefined,
      lineDiscountDiscountUnit: "",
      lineDiscountTiers: [],
      groupDiscount: false,
      groupDiscountTierUnit: undefined,
      groupDiscountDiscountUnit: "",
      groupDiscountTiers: [],
      groupDiscountBasedOn: undefined,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createContract(
        {
          code: values.code.toUpperCase(),
          contractType: values.contractType ?? null,
          description: values.description,
          contractGroupUuid: values.contractGroupUuid,
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
          // Details
          grossPrice: values.grossPrice,
          grossPriceValue: values.grossPriceValue || undefined,
          colorSurcharge: values.colorSurcharge,
          colorSurchargeValue: values.colorSurchargeValue || undefined,
          colorSurchargeUnit: values.colorSurchargeUnit || undefined,
          extraDiscount: values.extraDiscount,
          extraDiscountValue: values.extraDiscountValue || undefined,
          extraDiscountUnit: values.extraDiscountUnit || undefined,
          extraDiscountFromValue: values.extraDiscountFromValue || undefined,
          extraDiscountFromUnit: values.extraDiscountFromUnit || undefined,
          quantitySurcharge: values.quantitySurcharge,
          quantitySurchargeTierUnit: values.quantitySurchargeTierUnit ?? null,
          quantitySurchargeDiscountUnit: values.quantitySurchargeDiscountUnit || undefined,
          quantitySurchargeTiers: values.quantitySurchargeTiers,
          quantitySurchargePerType: values.quantitySurchargePerType ?? null,
          lineDiscount: values.lineDiscount,
          lineDiscountTierUnit: values.lineDiscountTierUnit ?? null,
          lineDiscountDiscountUnit: values.lineDiscountDiscountUnit || undefined,
          lineDiscountTiers: values.lineDiscountTiers,
          groupDiscount: values.groupDiscount,
          groupDiscountTierUnit: values.groupDiscountTierUnit ?? null,
          groupDiscountDiscountUnit: values.groupDiscountDiscountUnit || undefined,
          groupDiscountTiers: values.groupDiscountTiers,
          groupDiscountBasedOn: values.groupDiscountBasedOn ?? null,
        },
        companies,
      );
      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
