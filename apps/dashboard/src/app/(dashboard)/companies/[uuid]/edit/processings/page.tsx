import { getSuppliersForSelect } from "@/app/(dashboard)/companies/actions";
import { getCompanyHeader } from "@/app/(dashboard)/companies/[uuid]/edit/contacts/actions";
import { CompanyProcessingsEditor } from "@/components/companies/edit/company-processings-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProcessingsForCompany } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyProcessingsPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, processings, suppliers] = await Promise.all([
    getCompanyHeader(uuid),
    getProcessingsForCompany(uuid),
    getSuppliersForSelect(),
  ]);

  if (!company) {
    notFound();
  }

  // The label leads with the supplier code (searchCode1), matching the
  // "Supplier code" column in the grid.
  const supplierOptions = suppliers.map((supplier) => ({
    value: supplier.uuid,
    label: supplier.searchCode1
      ? `${supplier.searchCode1} — ${supplier.companyName}`
      : supplier.companyName,
  }));

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/companies/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`Processings — ${company.companyName}`} />
      <CompanyProcessingsEditor
        companyUuid={uuid}
        processings={processings}
        supplierOptions={supplierOptions}
      />
    </div>
  );
};

export default CompanyProcessingsPage;
