import { getContractsPerCustomer } from "@/app/(dashboard)/contracts-per-customer/actions";
import { ContractsPerCustomerTableContent } from "./contracts-per-customer-table-content";

export const ContractsPerCustomerTable = async () => {
  const rows = await getContractsPerCustomer();
  return <ContractsPerCustomerTableContent rows={rows} />;
};
