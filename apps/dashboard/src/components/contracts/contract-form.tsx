"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ContractGroupOption } from "@/app/(dashboard)/contract-groups/actions";
import { ContractCompanyEntry } from "@/app/(dashboard)/contracts/actions";
import { useContractSubmit } from "@/app/(dashboard)/contracts/use-contract-submit";
import { ContractFormValues } from "@/app/(dashboard)/contracts/validation";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { ContractableRole, contractableRoles } from "@/lib/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  AddCompanyDialog,
  CompanyLinkFormValues,
  companyLinkSchema,
} from "./dialogs/add-company-dialog";
import { ContractCompaniesSection } from "./sections/contract-companies-section";
import { ContractDetailsSection } from "./sections/contract-details-section";
import { ContractPriceDetailsSection } from "./sections/contract-price-details-section";
import { ContractSearchCodesSection } from "./sections/contract-search-codes-section";
import { ContractTypeSection } from "./sections/contract-type-section";
import { ContractWebsiteSection } from "./sections/contract-website-section";

type ContractFormProps = {
  groups: ContractGroupOption[];
  availableCompanies: CompanyOption[];
  /** Set when editing an existing contract; omitted when creating one. */
  contractUuid?: string;
  defaultValues?: ContractFormValues;
};

const contractableRoleSet = new Set(contractableRoles as readonly string[]);

export const ContractForm = ({
  groups,
  availableCompanies,
  contractUuid,
  defaultValues,
}: ContractFormProps) => {
  const router = useRouter();
  const [companies, setCompanies] = useState<ContractCompanyEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { form, isPending, isEditing, onSubmit, state } = useContractSubmit({
    companies,
    contractUuid,
    defaultValues,
  });

  const linkForm = useForm<CompanyLinkFormValues>({
    resolver: zodResolver(companyLinkSchema),
    defaultValues: {
      companyUuid: "",
      role: "" as ContractableRole,
      startingDate: "",
      endDate: "",
    },
  });

  // Only the create path navigates from here — updating redirects server-side.
  useEffect(() => {
    if (state.success && !isEditing) {
      router.push("/contracts");
    }
  }, [isEditing, router, state.success]);

  // Only companies that carry at least one contractable role
  const contractableCompanies = availableCompanies.filter((c) =>
    c.roles?.some((r) => contractableRoleSet.has(r)),
  );

  const openDialog = () => {
    linkForm.reset();
    setIsDialogOpen(true);
  };

  const handleSaveCompanyLink = linkForm.handleSubmit((values) => {
    const entry: ContractCompanyEntry = {
      companyUuid: values.companyUuid,
      role: values.role,
      startingDate: values.startingDate || null,
      endDate: values.endDate || null,
    };
    setCompanies((prev) => [...prev, entry]);
    setIsDialogOpen(false);
  });

  const removeCompany = (index: number) => {
    setCompanies((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-[200px_1fr_200px_200px]">
          <ContractTypeSection isPending={isPending} />
          <ContractDetailsSection isPending={isPending} groups={groups} />
          <ContractSearchCodesSection isPending={isPending} />
          <ContractWebsiteSection isPending={isPending} />
        </div>

        {/* Companies are linked when a contract is created — an existing one is
            already attached to whichever company it was created for. */}
        {!isEditing && (
          <ContractCompaniesSection
            isPending={isPending}
            companies={companies}
            availableCompanies={availableCompanies}
            onOpenDialog={openDialog}
            onRemoveCompany={removeCompany}
          />
        )}

        <ContractPriceDetailsSection isPending={isPending} />

        <FormError>{state.error}</FormError>

        <FormActions
          isPending={isPending}
          onCancel={() =>
            router.push(
              contractUuid ? `/contracts/${contractUuid}` : "/contracts",
            )
          }
          submitLabel={isEditing ? "Save Contract" : "Create Contract"}
        />
      </form>

      <AddCompanyDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        linkForm={linkForm}
        onSave={handleSaveCompanyLink}
        contractableCompanies={contractableCompanies}
      />
    </FormProvider>
  );
};
