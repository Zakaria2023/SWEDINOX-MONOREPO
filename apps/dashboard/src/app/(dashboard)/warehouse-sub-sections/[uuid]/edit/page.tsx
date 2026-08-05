import { getWarehouseSubSectionForEdit } from "@/app/(dashboard)/warehouse-sub-sections/actions";
import { subSectionToEditValues } from "@/app/(dashboard)/warehouse-sub-sections/mappers";
import { PageHeading } from "@/components/layout/page-heading";
import { WarehouseSubSectionEditForm } from "@/components/warehouse-sub-sections/warehouse-sub-section-edit-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditWarehouseSubSectionPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const subSection = await getWarehouseSubSectionForEdit(uuid);

  if (!subSection) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href="/warehouse-sub-sections"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Warehouse Sub Sections
        </Link>
      </div>
      <PageHeading
        title={`Edit ${subSection.name}`}
        description={
          subSection.parentName
            ? `Sits under ${subSection.parentName}. Editing never moves a sub section — create a new one to place it elsewhere.`
            : "Editing never moves a sub section — create a new one to place it elsewhere."
        }
      />
      <WarehouseSubSectionEditForm
        subSectionUuid={uuid}
        defaultValues={subSectionToEditValues(subSection)}
      />
    </div>
  );
};

export default EditWarehouseSubSectionPage;
