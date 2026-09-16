import { getVisitSchedule } from "@/app/(dashboard)/visit-schedule/actions";
import { VisitScheduleTable } from "@/components/visit-schedule/visit-schedule-table-content";

const VisitSchedulePage = async () => {
  const rows = await getVisitSchedule();

  return (
    <div className="space-y-4">
      <VisitScheduleTable rows={rows} />
    </div>
  );
};

export default VisitSchedulePage;
