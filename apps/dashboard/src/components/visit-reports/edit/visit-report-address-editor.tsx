"use client";

import { updateVisitReportAddressAndContact } from "@/app/(dashboard)/visit-reports/[uuid]/edit/actions";
import {
  ContactOption,
  getContactsByCompanyUuid,
} from "@/app/(dashboard)/visit-reports/actions";
import { VisitReportFormValues } from "@/app/(dashboard)/visit-reports/validation";
import { useEffect, useState } from "react";
import { AddressAndContactSection } from "../sections/address-and-contact-section";
import { VisitReportSectionForm } from "./visit-report-section-form";

type Props = {
  visitReportUuid: string;
  defaultValues: VisitReportFormValues;
};

export const VisitReportAddressEditor = ({
  visitReportUuid,
  defaultValues,
}: Props) => {
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // An existing report already names a company, so its contacts have to be
  // fetched before the form can show which one is selected.
  const companyUuid = defaultValues.companyUuid;
  useEffect(() => {
    if (!companyUuid) {
      return;
    }
    setLoadingContacts(true);
    getContactsByCompanyUuid(companyUuid).then((result) => {
      setContacts(result);
      setLoadingContacts(false);
    });
  }, [companyUuid]);

  return (
    <VisitReportSectionForm
      visitReportUuid={visitReportUuid}
      defaultValues={defaultValues}
      save={updateVisitReportAddressAndContact}
    >
      {(isPending) => (
        <AddressAndContactSection
          isPending={isPending}
          contacts={contacts}
          loadingContacts={loadingContacts}
        />
      )}
    </VisitReportSectionForm>
  );
};
