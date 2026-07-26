"use client";

import {
  deleteCompanyContract,
  saveCompanyContract,
} from "@/app/(dashboard)/companies/[uuid]/edit/contracts/actions";
import {
  contractSelectionSchema,
  ContractSelectionValues,
  DEFAULT_CONTRACT_SELECTION,
} from "@/app/(dashboard)/companies/validation";
import type { ContractListItem } from "@/app/(dashboard)/contracts/actions";
import { ContractDialog } from "@/components/companies/dialogs/contract-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import type { SelectContracts } from "@/db/schema/contracts";
import type { ContractableRole } from "@/lib/enums";
import { CONTRACT_TYPE_LABELS, CONTRACTABLE_ROLE_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  companyUuid: string;
  contracts: SelectContracts[];
  availableContracts: ContractListItem[];
  activeContractableRoles: ContractableRole[];
};

// Contracts only support add + remove (matching the legacy flow): the dialog
// picks an existing contract as a template and the server copies its fields
// into a company-owned row, so there is nothing meaningful to edit in place.
export const CompanyContractsEditor = ({
  companyUuid,
  contracts,
  availableContracts,
  activeContractableRoles,
}: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SelectContracts | null>(
    null,
  );

  const [saveState, dispatchSave, isSaving] = useActionState(
    saveCompanyContract,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteCompanyContract,
    {},
  );

  const contractForm = useForm<ContractSelectionValues>({
    resolver: zodResolver(contractSelectionSchema),
    defaultValues: DEFAULT_CONTRACT_SELECTION,
  });

  // With exactly one contractable role the dialog shows it as a fixed badge,
  // so it must already be set as the form value.
  const defaultRole =
    activeContractableRoles.length === 1
      ? activeContractableRoles[0]
      : DEFAULT_CONTRACT_SELECTION.role;

  useEffect(() => {
    if (saveState.success) {
      setIsDialogOpen(false);
      contractForm.reset(DEFAULT_CONTRACT_SELECTION);
    }
  }, [saveState, contractForm]);

  useEffect(() => {
    if (deleteState.success) {
      setDeleteTarget(null);
    }
  }, [deleteState]);

  const handleOpenAdd = () => {
    contractForm.reset({ contractUuid: "", role: defaultRole });
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      contractForm.reset(DEFAULT_CONTRACT_SELECTION);
    }
    setIsDialogOpen(open);
  };

  const handleCancel = () => {
    handleDialogOpenChange(false);
  };

  const handleSave = contractForm.handleSubmit((values) => {
    dispatchSave({ companyUuid, values });
  });

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      dispatchDelete({ companyUuid, contractUuid: deleteTarget.uuid });
    }
  };

  return (
    <div className="space-y-4">
      <FormError>{saveState.error ?? deleteState.error}</FormError>

      <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
        {contracts.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No contracts yet — add the first one below.
          </p>
        )}
        {contracts.map((contract) => (
          <div
            key={contract.uuid}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
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
                <span className="line-clamp-1 text-muted-foreground">
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
              onClick={() => setDeleteTarget(contract)}
              className="rounded p-1 text-muted-foreground hover:text-destructive"
              disabled={isSaving || isDeleting}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete contract</span>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          disabled={isSaving || isDeleting}
        >
          <Plus className="size-4" />
          Add Contract
        </button>
      </div>

      <ContractDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onCancel={handleCancel}
        onSave={handleSave}
        form={contractForm}
        availableContracts={availableContracts}
        activeContractableRoles={activeContractableRoles}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete contract"
        description={`Delete ${
          deleteTarget ? deleteTarget.code : "this contract"
        }? This can't be undone.`}
        confirmLabel="Delete"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
