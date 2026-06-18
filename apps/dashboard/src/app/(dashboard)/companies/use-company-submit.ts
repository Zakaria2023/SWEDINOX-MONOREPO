"use client";

import { CompanyRole } from "@/lib/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  CommSettingInput,
  CompanyActionResult,
  CompanyContactInput,
  CompanyContractInput,
  CompanyTextInput,
  createCompany,
} from "./actions";
import { CompanyFormValues, createCompanySchema } from "./validation";

const mapAddress = (address: CompanyFormValues["address"]) => ({
  altName: address.altName || undefined,
  poBox: address.poBox,
  streetAndNo: address.streetAndNo || undefined,
  postalCode: address.postalCode || undefined,
  country: address.country || undefined,
  city: address.city || undefined,
  region: address.region || undefined,
  house: address.house || undefined,
  telephone: address.telephone || undefined,
  fax: address.fax || undefined,
  email: address.email || undefined,
  website: address.website || undefined,
  billingAttention: address.billingAttention || undefined,
  billingAttentionAdditional: address.billingAttentionAdditional || undefined,
  gln: address.gln || undefined,
  peppolId: address.peppolId || undefined,
  sequenceNumber: address.sequenceNumber
    ? Number(address.sequenceNumber)
    : undefined,
  category: address.category,
  needCrane: address.needCrane,
  canopyRequired: address.canopyRequired,
  bundleSeparately: address.bundleSeparately,
  addressComplete: address.addressComplete,
  specialTransport: address.specialTransport,
  availableAt: address.availableAt || undefined,
  unloadingStartTime: address.unloadingStartTime || undefined,
  unloadingEndTime: address.unloadingEndTime || undefined,
  maxLength: address.maxLength || undefined,
  maxBundleWeight: address.maxBundleWeight || undefined,
  loadingInstructions: address.loadingInstructions || undefined,
});

export const useCompanySubmit = () => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<CompanyActionResult>({});

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(createCompanySchema()),
    defaultValues: {
      companyName: "",
      correspName: "",
      remarks: "",
      lang: "",
      roles: [],
      searchCode1: "",
      searchCode2: "",
      searchCode3: "",
      address: {
        category: [],
        poBox: false,
        needCrane: false,
        canopyRequired: false,
        bundleSeparately: false,
        addressComplete: false,
        specialTransport: false,
        altName: "",
        streetAndNo: "",
        postalCode: "",
        country: "",
        city: "",
        region: "",
        house: "",
        telephone: "",
        fax: "",
        email: "",
        website: "",
        billingAttention: "",
        billingAttentionAdditional: "",
        gln: "",
        peppolId: "",
        sequenceNumber: "",
        availableAt: "",
        unloadingStartTime: "",
        unloadingEndTime: "",
        maxLength: "",
        maxBundleWeight: "",
        loadingInstructions: "",
      },
    },
  });

  const onSubmit = (
    additionalAddresses: CompanyFormValues["address"][],
    communicationSettings: CommSettingInput[] = [],
    contracts: CompanyContractInput[] = [],
    contacts: CompanyContactInput[] = [],
    texts: CompanyTextInput[] = [],
  ) =>
    form.handleSubmit((values) => {
      startTransition(async () => {
        const {
          companyName,
          correspName,
          remarks,
          lang,
          roles,
          searchCode1,
          searchCode2,
          searchCode3,
          address,
        } = values;
        const allAddresses = [address, ...additionalAddresses].map(mapAddress);
        const result = await createCompany(
          {
            companyName,
            correspName: correspName || undefined,
            remarks: remarks || undefined,
            lang: lang || undefined,
            searchCode1: searchCode1 || undefined,
            searchCode2: searchCode2 || undefined,
            searchCode3: searchCode3 || undefined,
            roles: (roles ?? []) as CompanyRole[],
          },
          allAddresses,
          communicationSettings,
          contracts,
          contacts,
          texts,
        );
        setState(result);
      });
    });

  return { form, isPending, onSubmit, state };
};
