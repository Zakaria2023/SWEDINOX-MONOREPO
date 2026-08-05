import { getCommunicationSettings } from "@/app/(dashboard)/communication-settings/actions";
import { CommunicationSettingsTable } from "@/components/communication-settings/communication-settings-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CommunicationSettingsPage = async () => {
  const settings = await getCommunicationSettings();

  return (
    <div className="space-y-4">
      <PageHeading title="Communication Settings" />
      <CommunicationSettingsTable settings={settings} />
    </div>
  );
};

export default CommunicationSettingsPage;
