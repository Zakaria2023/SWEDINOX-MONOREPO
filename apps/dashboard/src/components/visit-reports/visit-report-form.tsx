"use client";

import { FormProvider } from "react-hook-form";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { DashboardUserOption } from "@/lib/server/clerk";
import { ContactOption, getContactsByCompanyUuid } from "@/app/(dashboard)/visit-reports/actions";
import { useVisitReportSubmit } from "@/app/(dashboard)/visit-reports/use-visit-report-submit";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VisitReportSection } from "./sections/visit-report-section";
import { AddressAndContactSection } from "./sections/address-and-contact-section";
import { DetailsSection } from "./sections/details-section";

type VisitReportFormProps = {
  companies: CompanyOption[];
  adminUsers: DashboardUserOption[];
};

export const VisitReportForm = ({
  companies,
  adminUsers,
}: VisitReportFormProps) => {
  const router = useRouter();
  const { form, isPending, onSubmit, state } = useVisitReportSubmit();

  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const handleCompanyChange = async (
    value: string,
    fieldOnChange: (value: string) => void,
  ) => {
    fieldOnChange(value);
    form.setValue("contactUuid", "");
    setContacts([]);

    if (value) {
      setLoadingContacts(true);
      const result = await getContactsByCompanyUuid(value);
      setContacts(result);
      setLoadingContacts(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <VisitReportSection
          isPending={isPending}
          companies={companies}
          adminUsers={adminUsers}
          onCompanyChange={handleCompanyChange}
        />

        <AddressAndContactSection
          isPending={isPending}
          contacts={contacts}
          loadingContacts={loadingContacts}
        />

        <DetailsSection isPending={isPending} />

        <FormError>{state.error}</FormError>

        <FormActions
          isPending={isPending}
          onCancel={() => router.push("/visit-reports")}
          submitLabel="Create Visit Report"
        />
      </form>
    </FormProvider>
  );
};
