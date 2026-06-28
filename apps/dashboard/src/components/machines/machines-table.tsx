import { getMachines } from "@/app/(dashboard)/machines/actions";
import { MachinesTableContent } from "@/components/machines/machines-table-content";

export const MachinesTable = async () => {
  const machines = await getMachines();

  return <MachinesTableContent machines={machines} />;
};
