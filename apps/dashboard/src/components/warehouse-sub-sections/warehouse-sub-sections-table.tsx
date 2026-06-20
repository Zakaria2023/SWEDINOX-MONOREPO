import { getWarehouseSubSections } from "@/app/(dashboard)/warehouse-sub-sections/actions";
import { WarehouseSubSectionsTableContent } from "@/components/warehouse-sub-sections/warehouse-sub-sections-table-content";

export const WarehouseSubSectionsTable = async () => {
  const subSections = await getWarehouseSubSections();

  return <WarehouseSubSectionsTableContent subSections={subSections} />;
};
