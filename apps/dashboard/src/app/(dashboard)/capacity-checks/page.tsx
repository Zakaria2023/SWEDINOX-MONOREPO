import { getCapacityChecks } from "@/app/(dashboard)/capacity-checks/actions";
import { CapacityChecksTable } from "@/components/capacity-checks/capacity-checks-table-content";

const CapacityChecksPage = async () => {
  const checks = await getCapacityChecks();

  return (
    <div className="space-y-4">
      <CapacityChecksTable checks={checks} />
    </div>
  );
};

export default CapacityChecksPage;
