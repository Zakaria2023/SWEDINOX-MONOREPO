import Link from "next/link";
import { getWarehouseSubSections } from "@/app/(dashboard)/warehouse-sub-sections/actions";
import { WarehouseSubSectionsTable } from "@/components/warehouse-sub-sections/warehouse-sub-sections-table-content";

const WarehouseSubSectionsPage = async () => {
  const subSections = await getWarehouseSubSections();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end">
        <Link
          href="/warehouse-sub-sections/add"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Sub Section
        </Link>
      </div>
      <WarehouseSubSectionsTable subSections={subSections} />
    </div>
  );
};

export default WarehouseSubSectionsPage;
