"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ContractGroupOption } from "@/app/(dashboard)/contract-groups/actions";
import { ContractCompanyEntry } from "@/app/(dashboard)/contracts/actions";
import { useContractSubmit } from "@/app/(dashboard)/contracts/use-contract-submit";
import { contractableRoles, ContractableRole } from "@/lib/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { AddCompanyDialog, CompanyLinkFormValues } from "./dialogs/add-company-dialog";
import { ContractTypeSection } from "./sections/contract-type-section";
import { ContractDetailsSection } from "./sections/contract-details-section";
import { ContractSearchCodesSection } from "./sections/contract-search-codes-section";
import { ContractWebsiteSection } from "./sections/contract-website-section";
import { ContractCompaniesSection } from "./sections/contract-companies-section";
import { ContractPriceDetailsSection } from "./sections/contract-price-details-section";

type ContractFormProps = {
  groups: ContractGroupOption[];
  availableCompanies: CompanyOption[];
};

const companyLinkSchema = z.object({
  companyUuid: z.string().min(1, "Company is required"),
  startingDate: z.string().optional(),
  endDate: z.string().optional(),
});

const contractableRoleSet = new Set(contractableRoles as readonly string[]);

const getContractableRole = (company: CompanyOption): ContractableRole | null =>
  (company.roles.find((r) => contractableRoleSet.has(r)) as ContractableRole) ??
  null;

export const ContractForm = ({
  groups,
  availableCompanies,
}: ContractFormProps) => {
  const router = useRouter();
  const [companies, setCompanies] = useState<ContractCompanyEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { form, isPending, onSubmit, state } = useContractSubmit(companies);

  const linkForm = useForm<CompanyLinkFormValues>({
    resolver: zodResolver(companyLinkSchema),
    defaultValues: {
      companyUuid: "",
      startingDate: "",
      endDate: "",
    },
  });

  useEffect(() => {
    if (state.success) {
      router.push("/contracts");
    }
  }, [router, state.success]);

  // Only companies that carry at least one contractable role
  const contractableCompanies = availableCompanies.filter((c) =>
    c.roles.some((r) => contractableRoleSet.has(r)),
  );

  const openDialog = () => {
    linkForm.reset();
    setIsDialogOpen(true);
  };

  const handleSaveCompanyLink = linkForm.handleSubmit((values) => {
    const company = contractableCompanies.find(
      (c) => c.uuid === values.companyUuid,
    );
    const role = company ? getContractableRole(company) : null;
    const entry: ContractCompanyEntry = {
      companyUuid: values.companyUuid,
      role,
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

        <ContractCompaniesSection
          isPending={isPending}
          companies={companies}
          availableCompanies={availableCompanies}
          onOpenDialog={openDialog}
          onRemoveCompany={removeCompany}
        />

        <ContractPriceDetailsSection isPending={isPending} />

        <FormError>{state.error}</FormError>

        <FormActions
          isPending={isPending}
          onCancel={() => router.push("/contracts")}
          submitLabel="Create Contract"
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
