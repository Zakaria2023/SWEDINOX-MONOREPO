"use client";

import { useFormContext } from "react-hook-form";
import { FileText, X } from "lucide-react";
import { ContractOption } from "@/app/(dashboard)/counter-orders/actions";
import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { Select } from "@/components/shadcn/select";
import { CONTRACT_TYPE_LABELS } from "@/lib/labels";

type Props = {
  contracts: ContractOption[];
};

const contractLabel = (contract: ContractOption): string =>
  [
    contract.code,
    contract.description,
    contract.contractType
      ? CONTRACT_TYPE_LABELS[contract.contractType]
      : null,
  ]
    .filter(Boolean)
    .join(" — ");

export const ContractsSection = ({ contracts }: Props) => {
  const { watch, setValue } = useFormContext<CounterOrderFormValues>();
  const selected = watch("contractUuids") ?? [];

  const availableOptions = [
    { value: "", label: "Select a contract…" },
    ...contracts
      .filter((contract) => !selected.includes(contract.uuid))
      .map((contract) => ({
        value: contract.uuid,
        label: contractLabel(contract),
      })),
  ];

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
        Contracts
      </h2>
      <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
        {selected.length > 0 && (
          <div className="space-y-2">
            {selected.map((uuid) => {
              const contract = contracts.find((c) => c.uuid === uuid);
              return (
                <div
                  key={uuid}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">
                    {contract ? contractLabel(contract) : uuid}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setValue(
                        "contractUuids",
                        selected.filter((value) => value !== uuid),
                      )
                    }
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label="Remove contract"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <Select
          id="contractUuids"
          value=""
          options={availableOptions}
          disabled={contracts.length === 0}
          onValueChange={(value) => {
            if (value) {
              setValue("contractUuids", [...selected, value]);
            }
          }}
        />
        {contracts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Select a customer to see available contracts.
          </p>
        )}
      </div>
    </section>
  );
};
