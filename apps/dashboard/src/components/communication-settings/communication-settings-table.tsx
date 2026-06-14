import { getCommunicationSettings } from "@/app/(dashboard)/communication-settings/actions";
import { CommunicationSettingsTableContent } from "@/components/communication-settings/communication-settings-table-content";

export const CommunicationSettingsTable = async () => {
  const settings = await getCommunicationSettings();

  return <CommunicationSettingsTableContent settings={settings} />;
};
