import { getVisitSchedule } from "@/app/(dashboard)/visit-schedule/actions";
import { VisitScheduleTable } from "@/components/visit-schedule/visit-schedule-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ToVisitCallPage = async () => {
  const rows = await getVisitSchedule();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="To visit / call"
        description="Customers and prospects with their call and visit status"
      />
      <VisitScheduleTable rows={rows} />
    </div>
  );
};

export default ToVisitCallPage;
