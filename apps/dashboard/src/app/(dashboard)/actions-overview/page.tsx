import { getActions } from "@/app/(dashboard)/actions-overview/actions";
import { ActionsOverviewTable } from "@/components/actions-overview/actions-overview-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ActionsOverviewPage = async () => {
  const rows = await getActions();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Actions"
        description="Assigned actions with a deadline and their execution status"
      />
      <ActionsOverviewTable rows={rows} />
    </div>
  );
};

export default ActionsOverviewPage;
