import { getCountListDeviations } from "@/app/(dashboard)/count-list-deviations/actions";
import { CountListDeviationsTable } from "@/components/count-list-deviations/count-list-deviations-table-content";

const CountListDeviationsPage = async () => {
  const deviations = await getCountListDeviations();

  return (
    <div className="space-y-4">
      <CountListDeviationsTable deviations={deviations} />
    </div>
  );
};

export default CountListDeviationsPage;
