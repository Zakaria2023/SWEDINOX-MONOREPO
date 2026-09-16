import { getSettings } from "@/app/(dashboard)/settings/actions";
import { BranchSettingsForm } from "@/components/settings/branch-settings-form";
import { currentUserHasRole } from "@/lib/auth";
import { getClerkUserNames } from "@/lib/server/clerk";

const SettingsPage = async () => {
  const [settings, canEdit, userNames] = await Promise.all([
    getSettings(),
    currentUserHasRole(["admin"]),
    getClerkUserNames(),
  ]);

  return (
    <div className="space-y-4">
      <BranchSettingsForm
        settings={settings}
        canEdit={canEdit}
        userNames={userNames}
      />
    </div>
  );
};

export default SettingsPage;
