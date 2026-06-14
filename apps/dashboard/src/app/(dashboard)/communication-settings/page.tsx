import { Suspense } from "react";
import { CommunicationSettingsTable } from "@/components/communication-settings/communication-settings-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const CommunicationSettingsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Communication Settings"
        description="Manage communication settings per company and document type"
      />
      <Suspense fallback={<DataTableFallback columnCount={6} />}>
        <CommunicationSettingsTable />
      </Suspense>
    </div>
  );
};

export default CommunicationSettingsPage;
