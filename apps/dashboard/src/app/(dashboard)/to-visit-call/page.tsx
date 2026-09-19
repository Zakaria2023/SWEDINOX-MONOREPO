import {
  getVisitSchedule,
  getVisitScheduleRegions,
} from "@/app/(dashboard)/visit-schedule/actions";
import { VISIT_SCHEDULE_LIST_KEYS } from "@/app/(dashboard)/visit-schedule/columns";
import { visitScheduleFilterControls } from "@/app/(dashboard)/visit-schedule/filters";
import { PageHeading } from "@/components/layout/page-heading";
import { VisitScheduleTable } from "@/components/visit-schedule/visit-schedule-table-content";
import { visitPlanPeriod } from "@/lib/helpers";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

/**
 * The relationship list, with no plan on it — the reference's `To visit/call`.
 *
 * Its 22 columns are the first 22 of `Visit schedule`, identical on 2 531 of
 * 2 531 rows, so this reads the same query and simply asks for fewer columns.
 * The month still reaches the query because the export shares it, but nothing
 * here shows it.
 */
const ToVisitCallPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const period = visitPlanPeriod(params.year, params.month);
  const page = await getVisitSchedule(parseTableQuery(params), period);
  const regions = await getVisitScheduleRegions();

  return (
    <div className="space-y-4">
      <PageHeading title="To visit/call" />
      <VisitScheduleTable
        page={page}
        filters={visitScheduleFilterControls(regions, false)}
        columnKeys={VISIT_SCHEDULE_LIST_KEYS}
        variant="list"
        period={period}
        fileName="to-visit-call"
      />
    </div>
  );
};

export default ToVisitCallPage;
