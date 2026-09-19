import {
  getVisitSchedule,
  getVisitScheduleRegions,
} from "@/app/(dashboard)/visit-schedule/actions";
import { VISIT_SCHEDULE_PLAN_KEYS } from "@/app/(dashboard)/visit-schedule/columns";
import { visitScheduleFilterControls } from "@/app/(dashboard)/visit-schedule/filters";
import { PageHeading } from "@/components/layout/page-heading";
import { VisitScheduleTable } from "@/components/visit-schedule/visit-schedule-table-content";
import { visitPlanPeriod } from "@/lib/helpers";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

/**
 * The list with one month's plan read back onto it — the reference's `Visit
 * schedule`.
 *
 * Read-only on purpose: the reference edits the ticks on `Change visit
 * schedule` and shows them here, and keeping that split means a screen somebody
 * scans is not also a screen they can change by accident.
 */
const VisitSchedulePage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const period = visitPlanPeriod(params.year, params.month);
  const page = await getVisitSchedule(parseTableQuery(params), period);
  const regions = await getVisitScheduleRegions();

  return (
    <div className="space-y-4">
      <PageHeading title="Visit schedule" />
      <VisitScheduleTable
        page={page}
        filters={visitScheduleFilterControls(regions, true)}
        columnKeys={VISIT_SCHEDULE_PLAN_KEYS}
        variant="plan"
        period={period}
        fileName="visit-schedule"
      />
    </div>
  );
};

export default VisitSchedulePage;
