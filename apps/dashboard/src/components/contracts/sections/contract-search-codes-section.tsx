"use client";

import { ContractFormValues } from "@/app/(dashboard)/contracts/validation";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { useFormContext } from "react-hook-form";

type ContractSearchCodesSectionProps = {
  isPending: boolean;
};

export const ContractSearchCodesSection = ({
  isPending,
}: ContractSearchCodesSectionProps) => {
  const { register } = useFormContext<ContractFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
        Search Codes
      </h2>
      <div className="space-y-3">
        <div>
          <FormLabel htmlFor="searchCode1">Search Code</FormLabel>
          <Input
            id="searchCode1"
            {...register("searchCode1")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="searchCode2">Search Code</FormLabel>
          <Input
            id="searchCode2"
            {...register("searchCode2")}
            disabled={isPending}
          />
        </div>
        <div>
          <FormLabel htmlFor="searchCode3">Search Code</FormLabel>
          <Input
            id="searchCode3"
            {...register("searchCode3")}
            disabled={isPending}
          />
        </div>
      </div>
    </section>
  );
};
