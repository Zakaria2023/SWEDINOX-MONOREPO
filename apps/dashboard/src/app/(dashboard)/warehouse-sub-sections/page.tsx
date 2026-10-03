import { getWarehouseSubSections } from "@/app/(dashboard)/warehouse-sub-sections/actions";
import { WarehouseSubSectionsTable } from "@/components/warehouse-sub-sections/warehouse-sub-sections-table-content";

const WarehouseSubSectionsPage = async () => {
  const subSections = await getWarehouseSubSections();

  return <WarehouseSubSectionsTable subSections={subSections} />;
};

export default WarehouseSubSectionsPage;
