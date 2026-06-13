import { Suspense } from "react";
import { CommunicationSettingsTable } from "@/components/communication-settings/communication-settings-table";
import { PageHeading } from "@/components/layout/page-heading";
import { TranslatedLink } from "@/components/layout/translated-link";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const CommunicationSettingsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeading
          titleKey="communication-settings-page.title"
          descriptionKey="communication-settings-page.description"
        />
        <TranslatedLink
          href="/communication-settings/add"
          labelKey="communication-settings-page.new-setting"
          className="inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        />
      </div>
      <Suspense fallback={<DataTableFallback columnCount={6} />}>
        <CommunicationSettingsTable />
      </Suspense>
    </div>
  );
};

export default CommunicationSettingsPage;
