"use client";

import { ContractFormValues } from "@/app/(dashboard)/contracts/validation";
import { Input } from "@/components/shadcn/input";
import { FormLabel } from "@/components/ui/form-field";
import { useFormContext } from "react-hook-form";

type ContractWebsiteSectionProps = {
  isPending: boolean;
};

export const ContractWebsiteSection = ({
  isPending,
}: ContractWebsiteSectionProps) => {
  const { register } = useFormContext<ContractFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
        Website
      </h2>
      <div className="space-y-3">
        <div>
          <FormLabel htmlFor="websiteSorting">Website Sorting</FormLabel>
          <Input
            id="websiteSorting"
            type="number"
            min={0}
            {...register("websiteSorting")}
            disabled={isPending}
            className="w-24"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="hideOnWebsite"
            {...register("hideOnWebsite")}
            className="size-4 accent-primary"
            disabled={isPending}
          />
          <label
            htmlFor="hideOnWebsite"
            className="text-sm font-medium text-gray-700"
          >
            Hide on Website
          </label>
        </div>
      </div>
    </section>
  );
};
