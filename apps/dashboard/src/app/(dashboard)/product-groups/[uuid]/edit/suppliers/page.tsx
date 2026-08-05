import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getProductGroupForEdit } from "@/app/(dashboard)/product-groups/[uuid]/edit/actions";
import { productGroupToFormValues } from "@/app/(dashboard)/product-groups/mappers";
import { PageHeading } from "@/components/layout/page-heading";
import { ProductGroupSupplierEditor } from "@/components/product-groups/edit/product-group-supplier-editor";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ProductGroupSuppliersPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [group, companies] = await Promise.all([
    getProductGroupForEdit(uuid),
    getCompaniesForSelect(),
  ]);

  if (!group) {
    notFound();
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <Link
          href={`/product-groups/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`Suppliers — ${group.name}`} />
      <ProductGroupSupplierEditor
        productGroupUuid={uuid}
        defaultValues={productGroupToFormValues(group, group.suppliers)}
        companies={companies}
      />
    </div>
  );
};

export default ProductGroupSuppliersPage;
