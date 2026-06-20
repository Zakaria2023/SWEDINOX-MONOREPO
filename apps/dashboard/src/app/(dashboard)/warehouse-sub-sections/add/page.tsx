import { getWarehousesForSelect } from "@/app/(dashboard)/warehouses/actions";
import { getWarehouseSubSectionsForSelect } from "@/app/(dashboard)/warehouse-sub-sections/actions";
import { WarehouseSubSectionForm } from "@/components/warehouse-sub-sections/warehouse-sub-section-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddWarehouseSubSectionPage = async () => {
  const [warehouses, subSections] = await Promise.all([
    getWarehousesForSelect(),
    getWarehouseSubSectionsForSelect(),
  ]);

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <PageHeading
        title="Add Warehouse Sub Section"
        description="Create a new sub section by adapting from an existing warehouse"
      />
      <WarehouseSubSectionForm warehouses={warehouses} subSections={subSections} />
    </div>
  );
};

export default AddWarehouseSubSectionPage;
