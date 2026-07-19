import { getCustomerRevenueSalesVisits } from "@/app/(dashboard)/customer-revenue-sales-and-visits/actions";
import { CustomerRevenueSalesVisitsTable } from "@/components/customer-revenue-sales-and-visits/customer-revenue-sales-and-visits-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { PeriodFilter } from "@/components/ui/period-filter";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

const CustomerRevenueSalesVisitsPage = async ({ searchParams }: Props) => {
  const { year } = await searchParams;
  const yearNum = year ? Number(year) : undefined;
  const rows = await getCustomerRevenueSalesVisits(yearNum);

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Customer revenue, sales and visits"
        description="Three-year sales comparison per customer and revenue group"
      />
      <PeriodFilter year={yearNum} />
      <CustomerRevenueSalesVisitsTable rows={rows} />
    </div>
  );
};

export default CustomerRevenueSalesVisitsPage;
