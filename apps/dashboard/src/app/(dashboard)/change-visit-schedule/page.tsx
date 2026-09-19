import {
  getVisitSchedule,
  getVisitScheduleRegions,
} from "@/app/(dashboard)/visit-schedule/actions";
import { VISIT_SCHEDULE_EDIT_KEYS } from "@/app/(dashboard)/visit-schedule/columns";
import { visitScheduleFilterControls } from "@/app/(dashboard)/visit-schedule/filters";
import { PageHeading } from "@/components/layout/page-heading";
import { VisitScheduleTable } from "@/components/visit-schedule/visit-schedule-table-content";
import { visitPlanPeriod } from "@/lib/helpers";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

/**
 * Where the month's plan is set — the reference's `Change visit schedule`.
 *
 * The same rows as `Visit schedule` with `Call` and `Visit` as tick boxes, and
 * without the `Month` column, since the month is this screen's own selection
 * rather than something each row reports.
 */
const ChangeVisitSchedulePage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const period = visitPlanPeriod(params.year, params.month);
  const page = await getVisitSchedule(parseTableQuery(params), period);
  const regions = await getVisitScheduleRegions();

  return (
    <div className="space-y-4">
      <PageHeading title="Change visit schedule" />
      <VisitScheduleTable
        page={page}
        filters={visitScheduleFilterControls(regions, true)}
        columnKeys={VISIT_SCHEDULE_EDIT_KEYS}
        variant="edit"
        period={period}
        fileName="change-visit-schedule"
      />
    </div>
  );
};

export default ChangeVisitSchedulePage;
