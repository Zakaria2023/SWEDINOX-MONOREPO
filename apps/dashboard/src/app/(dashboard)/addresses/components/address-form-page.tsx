"use client";

import { useSearchParams } from "next/navigation";
import { AddressForm } from "./address-form";

export const AddressFormPage = () => {
  const searchParams = useSearchParams();
  const companyUuid = searchParams.get("companyUuid") ?? undefined;

  return (
    <AddressForm
      companyUuid={companyUuid}
      lockCompany={Boolean(companyUuid)}
    />
  );
};
