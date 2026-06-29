"use client";

import { CompanyContractInput } from "@/app/(dashboard)/companies/actions";
import { ContractableRole } from "@/lib/enums";
import { CONTRACT_TYPE_LABELS, CONTRACTABLE_ROLE_LABELS } from "@/lib/labels";
import { FileText, Plus, X } from "lucide-react";

type Props = {
  contracts: CompanyContractInput[];
  removeContract: (index: number) => void;
  handleOpenContract: () => void;
  isPending: boolean;
  activeContractableRoles: ContractableRole[];
};

export const ContractsSection = ({
  contracts,
  removeContract,
  handleOpenContract,
  isPending,
  activeContractableRoles,
}: Props) => {
  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
        Contracts
      </h2>
      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {contracts.map((contract, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="font-mono font-medium text-foreground">
                {contract.code}
              </span>
              {contract.contractType && (
                <span className="text-muted-foreground">
                  {CONTRACT_TYPE_LABELS[contract.contractType]}
                </span>
              )}
              {contract.description && (
                <span className="truncate text-muted-foreground">
                  — {contract.description}
                </span>
              )}
              {contract.role && (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  {CONTRACTABLE_ROLE_LABELS[contract.role]}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeContract(index)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              disabled={isPending}
            >
              <X className="size-4" />
              <span className="sr-only">Remove contract</span>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleOpenContract}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          disabled={isPending}
        >
          <Plus className="size-4" />
          Add Contract
        </button>
      </div>
    </section>
  );
};
