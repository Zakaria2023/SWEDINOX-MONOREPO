import { getCompanyHeader } from "@/app/(dashboard)/companies/[uuid]/edit/contacts/actions";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { CompanyCustomerStockEditor } from "@/components/companies/edit/company-customer-stock-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyCustomerStock } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyCustomerStockPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, customerStock, productGroups, availableProducts] =
    await Promise.all([
      getCompanyHeader(uuid),
      getCompanyCustomerStock(uuid),
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
        title={`Customer Stock — ${company.companyName}`}
        description="Book, edit, or remove stock this customer keeps at one of our locations. Every change saves immediately."
      />
      <CompanyCustomerStockEditor
        companyUuid={uuid}
        customerStock={customerStock}
        productGroups={productGroups}
        availableProducts={availableProducts}
      />
    </div>
  );
};

export default CompanyCustomerStockPage;
