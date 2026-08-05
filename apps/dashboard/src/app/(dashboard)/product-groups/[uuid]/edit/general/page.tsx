import { getProductGroupForEdit } from "@/app/(dashboard)/product-groups/[uuid]/edit/actions";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { productGroupToFormValues } from "@/app/(dashboard)/product-groups/mappers";
import { PageHeading } from "@/components/layout/page-heading";
import { ProductGroupGeneralEditor } from "@/components/product-groups/edit/product-group-general-editor";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ProductGroupGeneralPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [group, groups] = await Promise.all([
    getProductGroupForEdit(uuid),
    getProductGroupsForSelect(),
  ]);

  if (!group) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/product-groups/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`General — ${group.name}`} />
      <ProductGroupGeneralEditor
        productGroupUuid={uuid}
        defaultValues={productGroupToFormValues(group, group.suppliers)}
        // A group can't be offered as its own parent, which would detach the
        // whole branch from the tree.
        parentCandidates={groups.filter((option) => option.uuid !== uuid)}
      />
    </div>
  );
};

export default ProductGroupGeneralPage;
