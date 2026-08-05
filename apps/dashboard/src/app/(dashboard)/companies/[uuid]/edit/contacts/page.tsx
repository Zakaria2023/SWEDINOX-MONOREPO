import { CompanyContactsEditor } from "@/components/companies/edit/company-contacts-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyContacts, getCompanyHeader } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyContactsPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, contacts] = await Promise.all([
    getCompanyHeader(uuid),
    getCompanyContacts(uuid),
  ]);

  if (!company) {
    notFound();
  }

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
      <PageHeading title={`Contacts — ${company.companyName}`} />
      <CompanyContactsEditor companyUuid={uuid} contacts={contacts} />
    </div>
  );
};

export default CompanyContactsPage;
