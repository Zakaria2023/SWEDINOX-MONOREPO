"use server";

import { getPrimaryAddressesByCompany } from "@/app/(dashboard)/addresses/actions";
import { getCustomersWithCustomerRole } from "@/app/(dashboard)/companies/actions";
import { getComplaintCountsByCompany } from "@/app/(dashboard)/complaints/actions";
import { getPrimaryContactsByCompany } from "@/app/(dashboard)/contacts/actions";
import { getInvoiceStatsByCompany } from "@/app/(dashboard)/invoices/actions";
import {
  getLastOrderDatesByCompany,
  getOrderCountsByCompany,
} from "@/app/(dashboard)/orders/actions";
import { getQuoteCountsByCompany } from "@/app/(dashboard)/quotes/actions";
import { getReturnOrderCountsByCompany } from "@/app/(dashboard)/return-orders/actions";
import { getVisitCountsByCompany } from "@/app/(dashboard)/visit-reports/actions";
import { SelectCompanies, SelectCompanyAddresses, SelectContacts } from "@/db";

export type CustomerOverviewRow = Pick<
  SelectCompanies,
  | "searchCode1"
  | "searchCode2"
  | "searchCode3"
  | "companyName"
  | "representative"
  | "accountManager"
  | "region"
  | "customerGroup"
  | "vatNumber"
  | "actionEmailTo"
  | "releaseActionEmailTo"
> & {
  companyUuid: SelectCompanies["uuid"];
  customerCode: SelectCompanies["id"];
  streetAndNo: SelectCompanyAddresses["streetAndNo"] | null;
  city: SelectCompanyAddresses["city"] | null;
  postalCode: SelectCompanyAddresses["postalCode"] | null;
  addressEmail: SelectCompanyAddresses["email"] | null;
  initials: SelectContacts["initials"] | null;
  contactEmail: SelectContacts["email"] | null;
  regionCode: SelectContacts["customerRegionCode"] | null;
  quotes: number;
  orders: number;
  invoices: number;
  visits: number;
  returnOrders: number;
  complaints: number;
  lastOrderDate: string | null;
  invoicedOrdersRevenue: number;
  avgOrderSize: number;
};

export const getCustomerOverview = async (): Promise<CustomerOverviewRow[]> => {
  try {
    const customers = await getCustomersWithCustomerRole();
    if (customers.length === 0) return [];

    const [
      addressByCompany,
      contactByCompany,
      quotesByCompany,
      ordersByCompany,
      lastOrderByCompany,
      invoicesByCompany,
      visitsByCompany,
      returnOrdersByCompany,
      complaintsByCompany,
    ] = await Promise.all([
      getPrimaryAddressesByCompany(),
      getPrimaryContactsByCompany(),
      getQuoteCountsByCompany(),
      getOrderCountsByCompany(),
      getLastOrderDatesByCompany(),
      getInvoiceStatsByCompany(),
      getVisitCountsByCompany(),
      getReturnOrderCountsByCompany(),
      getComplaintCountsByCompany(),
    ]);

    return customers.map((customer): CustomerOverviewRow => {
      const address = addressByCompany.get(customer.uuid);
      const contact = contactByCompany.get(customer.uuid);
      const lastOrder = lastOrderByCompany.get(customer.uuid);
      const invoiceStats = invoicesByCompany.get(customer.uuid);
      const invoiceCount = invoiceStats?.count ?? 0;
      const invoiceRevenue = invoiceStats?.revenue ?? 0;

      return {
        companyUuid: customer.uuid,
        customerCode: customer.id,
        companyName: customer.companyName,
        searchCode1: customer.searchCode1,
        searchCode2: customer.searchCode2,
        searchCode3: customer.searchCode3,
        representative: customer.representative,
        accountManager: customer.accountManager,
        region: customer.region,
        customerGroup: customer.customerGroup,
        vatNumber: customer.vatNumber,
        actionEmailTo: customer.actionEmailTo,
        releaseActionEmailTo: customer.releaseActionEmailTo,
        streetAndNo: address?.streetAndNo ?? null,
        city: address?.city ?? null,
        postalCode: address?.postalCode ?? null,
        addressEmail: address?.email ?? null,
        initials: contact?.initials ?? null,
        contactEmail: contact?.email ?? null,
        regionCode: contact?.customerRegionCode ?? null,
        quotes: quotesByCompany.get(customer.uuid) ?? 0,
        orders: ordersByCompany.get(customer.uuid) ?? 0,
        invoices: invoiceCount,
        visits: visitsByCompany.get(customer.uuid) ?? 0,
        returnOrders: returnOrdersByCompany.get(customer.uuid) ?? 0,
        complaints: complaintsByCompany.get(customer.uuid) ?? 0,
        lastOrderDate: lastOrder?.toISOString().split("T")[0] ?? null,
        invoicedOrdersRevenue: invoiceRevenue,
        avgOrderSize:
          invoiceCount > 0
            ? Number((invoiceRevenue / invoiceCount).toFixed(2))
            : 0,
      };
    });
  } catch {
    throw new Error("Failed to fetch customer overview");
  }
};
