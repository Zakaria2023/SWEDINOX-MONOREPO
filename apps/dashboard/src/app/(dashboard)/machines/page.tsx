import { getMachines } from "@/app/(dashboard)/machines/actions";
import { MachinesTable } from "@/components/machines/machines-table-content";

const MachinesPage = async () => {
  const machines = await getMachines();

  return <MachinesTable machines={machines} />;
};

export default MachinesPage;
