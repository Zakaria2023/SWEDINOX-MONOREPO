import { getMachineForEdit } from "@/app/(dashboard)/machines/[uuid]/edit/actions";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { MachineProductsEditor } from "@/components/machines/edit/machine-products-editor";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const MachineProductsPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [machine, productGroups, availableProducts] = await Promise.all([
    getMachineForEdit(uuid),
    getProductGroupsForSelect(),
    getProductsForSelect(),
  ]);

  if (!machine) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <Link
          href={`/machines/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`Products — ${machine.name}`} />
      <MachineProductsEditor
        machineUuid={uuid}
        products={machine.products.map((product) => ({
          productUuid: product.productUuid,
          productGroupUuid: product.productGroupUuid,
          productCode: product.productCode,
          description: product.description,
          preference: product.preference,
          productionPerHour: product.productionPerHour,
          prodUnit: product.prodUnit,
          minCorner: product.minCorner,
          maxCorner: product.maxCorner,
          daysInSystem: product.daysInSystem,
        }))}
        productGroups={productGroups}
        availableProducts={availableProducts}
      />
    </div>
  );
};

export default MachineProductsPage;
