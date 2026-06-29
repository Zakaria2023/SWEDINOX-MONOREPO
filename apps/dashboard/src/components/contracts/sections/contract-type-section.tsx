"use client";

import { ContractFormValues } from "@/app/(dashboard)/contracts/validation";
import { contractTypes } from "@/lib/enums";
import { CONTRACT_TYPE_LABELS } from "@/lib/labels";
import { useFormContext } from "react-hook-form";

type ContractTypeSectionProps = {
  isPending: boolean;
};

export const ContractTypeSection = ({ isPending }: ContractTypeSectionProps) => {
  const { watch, setValue } = useFormContext<ContractFormValues>();
  const contractType = watch("contractType");

  return (
    <section className="space-y-3">
      <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
        Contract Type
      </h2>
      <div className="space-y-2">
        {contractTypes.map((type) => (
          <label
            key={type}
            className="flex cursor-pointer items-center gap-2.5"
          >
            <input
              type="radio"
              className="size-4 accent-primary"
              checked={contractType === type}
              onChange={() => setValue("contractType", type)}
              disabled={isPending}
            />
            <span className="text-sm text-gray-700">
              {CONTRACT_TYPE_LABELS[type]}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
};
