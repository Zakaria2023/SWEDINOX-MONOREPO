"use server";

import { getDeliveryAddressesByCompany } from "@/app/(dashboard)/addresses/actions";
import { getCustomerAndProspectCompaniesWithDetails } from "@/app/(dashboard)/companies/actions";
import { getPrimaryContactsByCompany } from "@/app/(dashboard)/contacts/actions";
import { SelectCompanies, SelectContacts } from "@/db";

export type CustomerProspectRow = Pick<
  SelectCompanies,
  | "companyName"
  | "searchCode1"
  | "searchCode2"
  | "searchCode3"
  | "representative"
  | "accountManager"
  | "region"
  | "customerGroup"
  | "creditLimit"
  | "cocNumber"
  | "createdAt"
> &
  Pick<
    SelectContacts,
    | "revenueLastYear"
    | "revenueThisYear"
    | "competitors"
    | "customerRegionCode"
    | "visitStreetAndNo"
    | "visitPostalCode"
    | "visitCity"
    | "visitCountry"
    | "visitTelephone"
    | "visitFax"
  > & {
    companyUuid: SelectCompanies["uuid"];
    companyCode: SelectCompanies["id"];
    contactFirstName: SelectContacts["firstName"] | null;
    contactLastName: SelectContacts["lastName"] | null;
    contactEmail: SelectContacts["email"] | null;
    contactMobile: SelectContacts["mobile"] | null;
    contactCreatedAt: SelectContacts["createdAt"] | null;
    correspondenceStreetAndNo: SelectContacts["streetAndNo"] | null;
    correspondencePostalCode: SelectContacts["postalCode"] | null;
    correspondenceCity: SelectContacts["city"] | null;
    correspondenceCountry: SelectContacts["addressCountry"] | null;
    correspondenceTelephone: SelectContacts["addressTelephone"] | null;
    correspondenceFax: SelectContacts["addressFax"] | null;
    deliveryStreetAndNo: string | null;
    deliveryPostalCode: string | null;
    deliveryCity: string | null;
    deliveryCountry: string | null;
    isCustomer: boolean;
    isProspect: boolean;
    isSupplier: boolean;
    isProcessor: boolean;
    isTransporter: boolean;
    isAgent: boolean;
    isOther: boolean;
    completeDelivery: boolean;
    targetVisitsPerYear: number;
  };

export const getCustomersAndProspects = async (): Promise<
  CustomerProspectRow[]
> => {
  const [companies, contactsByCompany, deliveryAddressesByCompany] =
    await Promise.all([
      getCustomerAndProspectCompaniesWithDetails(),
      getPrimaryContactsByCompany(),
      getDeliveryAddressesByCompany(),
    ]);

  return companies.map((company): CustomerProspectRow => {
    const contact = contactsByCompany.get(company.uuid);
    const delivery = deliveryAddressesByCompany.get(company.uuid);

    return {
      companyUuid: company.uuid,
      companyCode: company.id,
      companyName: company.companyName,
      searchCode1: company.searchCode1,
      searchCode2: company.searchCode2,
      searchCode3: company.searchCode3,
      representative: company.representative,
      accountManager: company.accountManager,
      region: company.region,
      customerGroup: company.customerGroup,
      creditLimit: company.creditLimit,
      cocNumber: company.cocNumber,
      createdAt: company.createdAt,

      contactFirstName: contact?.firstName ?? null,
      contactLastName: contact?.lastName ?? null,
      contactEmail: contact?.email ?? null,
      contactMobile: contact?.mobile ?? null,
      contactCreatedAt: contact?.createdAt ?? null,
      revenueLastYear: contact?.revenueLastYear ?? null,
      revenueThisYear: contact?.revenueThisYear ?? null,
      competitors: contact?.competitors ?? null,
      customerRegionCode: contact?.customerRegionCode ?? null,
      visitStreetAndNo: contact?.visitStreetAndNo ?? null,
      visitPostalCode: contact?.visitPostalCode ?? null,
      visitCity: contact?.visitCity ?? null,
      visitCountry: contact?.visitCountry ?? null,
      visitTelephone: contact?.visitTelephone ?? null,
      visitFax: contact?.visitFax ?? null,
      correspondenceStreetAndNo: contact?.streetAndNo ?? null,
      correspondencePostalCode: contact?.postalCode ?? null,
      correspondenceCity: contact?.city ?? null,
      correspondenceCountry: contact?.addressCountry ?? null,
      correspondenceTelephone: contact?.addressTelephone ?? null,
      correspondenceFax: contact?.addressFax ?? null,

      deliveryStreetAndNo: delivery?.streetAndNo ?? null,
      deliveryPostalCode: delivery?.postalCode ?? null,
      deliveryCity: delivery?.city ?? null,
      deliveryCountry: delivery?.country ?? null,

      isCustomer: company.roles.includes("customer"),
      isProspect: company.roles.includes("prospect"),
      isSupplier: company.roles.includes("supplier"),
      isProcessor: company.roles.includes("processor"),
      isTransporter: company.roles.includes("transporter"),
      isAgent: company.roles.includes("agent"),
      isOther: company.roles.includes("other"),
      completeDelivery:
        company.quoteOrderSettings.includes("complete_delivery"),
      targetVisitsPerYear: 0,
    };
  });
};
