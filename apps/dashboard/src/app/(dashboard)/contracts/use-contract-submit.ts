"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  ContractActionResult,
  ContractCompanyEntry,
  createContract,
  updateContract,
} from "./actions";
import { contractFormToInput } from "./mappers";
import { ContractFormValues, createContractSchema } from "./validation";

type UseContractSubmitParams = {
  companies: ContractCompanyEntry[];
  /** Set when editing an existing contract; omitted when creating one. */
  contractUuid?: string;
  defaultValues?: ContractFormValues;
};

const DEFAULT_CONTRACT: ContractFormValues = {
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
};

export const useContractSubmit = ({
  companies,
  contractUuid,
  defaultValues,
}: UseContractSubmitParams) => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ContractActionResult>({});

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(createContractSchema()),
    defaultValues: defaultValues ?? DEFAULT_CONTRACT,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const input = contractFormToInput(values);

      // Updating redirects from inside the action; creating one contract per
      // linked company is a create-only concern, since an existing contract is
      // already attached to whichever company it was created for.
      if (contractUuid) {
        setState(await updateContract(contractUuid, input));
        return;
      }

      setState(await createContract(input, companies));
    });
  });

  return { form, isPending, isEditing: Boolean(contractUuid), onSubmit, state };
};
