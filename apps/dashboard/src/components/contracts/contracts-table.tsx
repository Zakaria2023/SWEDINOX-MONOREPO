import { getContracts } from "@/app/(dashboard)/contracts/actions";
import { ContractsTableContent } from "@/components/contracts/contracts-table-content";

export const ContractsTable = async () => {
  const contracts = await getContracts();

  return <ContractsTableContent contracts={contracts} />;
};
