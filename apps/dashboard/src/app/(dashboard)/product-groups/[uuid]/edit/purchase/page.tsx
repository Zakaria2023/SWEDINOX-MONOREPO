import { getProductGroupForEdit } from "@/app/(dashboard)/product-groups/[uuid]/edit/actions";
import { productGroupToFormValues } from "@/app/(dashboard)/product-groups/mappers";
import { PageHeading } from "@/components/layout/page-heading";
import { ProductGroupPurchaseEditor } from "@/components/product-groups/edit/product-group-purchase-editor";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ProductGroupPurchasePage = async ({ params }: Props) => {
  const { uuid } = await params;
  const group = await getProductGroupForEdit(uuid);

  if (!group) {
    notFound();
  }

  return (
    <div className="max-w-5xl space-y-6 p-6">
      <div>
        <Link
          href={`/product-groups/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`Purchase — ${group.name}`} />
      <ProductGroupPurchaseEditor
        productGroupUuid={uuid}
        defaultValues={productGroupToFormValues(group, group.suppliers)}
      />
    </div>
  );
};

export default ProductGroupPurchasePage;
