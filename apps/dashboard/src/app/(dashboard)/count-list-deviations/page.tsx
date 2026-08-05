import { getCountListDeviations } from "@/app/(dashboard)/count-list-deviations/actions";
import { CountListDeviationsTable } from "@/components/count-list-deviations/count-list-deviations-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CountListDeviationsPage = async () => {
  const deviations = await getCountListDeviations();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Deviations in Count Lists" />
      <CountListDeviationsTable deviations={deviations} />
    </div>
  );
};

export default CountListDeviationsPage;
