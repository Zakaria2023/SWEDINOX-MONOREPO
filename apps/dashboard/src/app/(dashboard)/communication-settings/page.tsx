import { getCommunicationSettings } from "@/app/(dashboard)/communication-settings/actions";
import { CommunicationSettingsTable } from "@/components/communication-settings/communication-settings-table-content";

const CommunicationSettingsPage = async () => {
  const settings = await getCommunicationSettings();

  return (
    <div className="space-y-4">
      <CommunicationSettingsTable settings={settings} />
    </div>
  );
};

export default CommunicationSettingsPage;
