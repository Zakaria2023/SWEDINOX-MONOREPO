import { getCommunicationSettings } from "@/app/(dashboard)/communication-settings/actions";
import { CommunicationSettingsTableContent } from "@/components/communication-settings/communication-settings-table-content";
import { unstable_noStore as noStore } from "next/cache";

export const CommunicationSettingsTable = async () => {
  noStore();

  const settings = await getCommunicationSettings();

  return <CommunicationSettingsTableContent settings={settings} />;
};
