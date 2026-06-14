import { getContractsPerSupplier } from "@/app/(dashboard)/contracts/actions";
import { ContractsPerSupplierTableContent } from "./contracts-per-supplier-table-content";

export const ContractsPerSupplierTable = async () => {
  const rows = await getContractsPerSupplier();
  return <ContractsPerSupplierTableContent rows={rows} />;
};
