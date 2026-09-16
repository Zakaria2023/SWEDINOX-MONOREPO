import { getOpenWorkPanels } from "@/app/(dashboard)/open-work-panels/actions";
import { OpenWorkPanelsTable } from "@/components/open-work-panels/open-work-panels-table";
import { currentUserHasRole } from "@/lib/auth";
import { getClerkUserNames } from "@/lib/server/clerk";

const OpenWorkPanelsPage = async () => {
  const [rows, userNames, canDelete] = await Promise.all([
    getOpenWorkPanels(),
    getClerkUserNames(),
    currentUserHasRole(["admin"]),
  ]);

  return (
    <div className="space-y-4">
      <OpenWorkPanelsTable
        rows={rows}
        userNames={userNames}
        canDelete={canDelete}
      />
    </div>
  );
};

export default OpenWorkPanelsPage;
