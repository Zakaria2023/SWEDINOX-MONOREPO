import { getCompanyHeader } from "@/app/(dashboard)/companies/[uuid]/edit/contacts/actions";
import { CompanySalesForm } from "@/components/companies/edit/company-sales-form";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanySales } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanySalesPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, sales] = await Promise.all([
    getCompanyHeader(uuid),
    getCompanySales(uuid),
  ]);

  if (!company || !sales) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <Link
          href={`/companies/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`Sales — ${company.companyName}`} />
      <CompanySalesForm company={sales} />
    </div>
  );
};

export default CompanySalesPage;
