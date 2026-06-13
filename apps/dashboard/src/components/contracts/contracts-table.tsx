import { getContracts } from "@/app/(dashboard)/contracts/actions";
import { ContractsTableContent } from "@/components/contracts/contracts-table-content";
import { unstable_noStore as noStore } from "next/cache";

export const ContractsTable = async () => {
  noStore();

  const contracts = await getContracts();

  return <ContractsTableContent contracts={contracts} />;
};
