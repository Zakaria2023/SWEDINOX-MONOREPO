import { getCompanyHeader } from "@/app/(dashboard)/companies/[uuid]/edit/contacts/actions";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { CompanyProductsEditor } from "@/components/companies/edit/company-products-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyProducts } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyProductsPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, products, productGroups, availableProducts] =
    await Promise.all([
      getCompanyHeader(uuid),
      getCompanyProducts(uuid),
      getProductGroupsForSelect(),
      getProductsForSelect(),
    ]);

  if (!company) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href={`/companies/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading
        title={`Products — ${company.companyName}`}
        description="Add, edit, or remove the company's own product records. Every change saves immediately."
      />
      <CompanyProductsEditor
        companyUuid={uuid}
        products={products}
        productGroups={productGroups}
        availableProducts={availableProducts}
      />
    </div>
  );
};

export default CompanyProductsPage;
