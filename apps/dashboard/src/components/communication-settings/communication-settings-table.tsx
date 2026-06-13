import { getCommunicationSettings } from "@/app/(dashboard)/communication-settings/actions";
import { CommunicationSettingsTableContent } from "@/components/communication-settings/communication-settings-table-content";
import { unstable_noStore as noStore } from "next/cache";

export const CommunicationSettingsTable = async () => {
  noStore();

  const raw = await getCommunicationSettings();
  const settings = raw.map(({ communication_settings, Companies: company }) => ({
    ...communication_settings,
    companyName: company?.companyName ?? null,
    searchCode1: company?.searchCode1 ?? null,
  }));

  return <CommunicationSettingsTableContent settings={settings} />;
};
