import { getCapacityChecks } from "@/app/(dashboard)/capacity-checks/actions";
import { CapacityChecksTable } from "@/components/capacity-checks/capacity-checks-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CapacityChecksPage = async () => {
  const checks = await getCapacityChecks();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Capacity Checks"
        description="Configured capacity checks — occupied vs. maximum capacity, warning thresholds and alert-email timing"
      />
      <CapacityChecksTable checks={checks} />
    </div>
  );
};

export default CapacityChecksPage;
