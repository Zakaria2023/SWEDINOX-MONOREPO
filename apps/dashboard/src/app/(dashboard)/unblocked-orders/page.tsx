import { getUnblockedOrders } from "@/app/(dashboard)/unblocked-orders/actions";
import { UnblockedOrdersTable } from "@/components/unblocked-orders/unblocked-orders-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

const UnblockedOrdersPage = async ({ searchParams }: Props) => {
  const { year, month } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const monthNum = month ? Number(month) : undefined;
  const rows = await getUnblockedOrders({ year: yearNum, month: monthNum });

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Unblocked orders"
        description="Orders whose block has been released, from the deblock audit trail"
      />
      <PeriodFilter year={yearNum} month={monthNum} />
      <UnblockedOrdersTable rows={rows} />
    </div>
  );
};

export default UnblockedOrdersPage;
