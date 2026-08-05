import {
  getCompanyContacts,
  getCompanyHeader,
} from "@/app/(dashboard)/companies/[uuid]/edit/contacts/actions";
import { CompanyVisitReportsEditor } from "@/components/companies/edit/company-visit-reports-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVisitReportsForCompany } from "./actions";
import { contactDisplayName } from "./mappers";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyVisitReportsPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, visitReports, contacts] = await Promise.all([
    getCompanyHeader(uuid),
    getVisitReportsForCompany(uuid),
    getCompanyContacts(uuid),
  ]);

  if (!company) {
    notFound();
  }

  const contactOptions = contacts.map((contact) => ({
    value: contact.uuid,
    label: contactDisplayName(contact),
  }));

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
      <PageHeading title={`Visit Reports — ${company.companyName}`} />
      <CompanyVisitReportsEditor
        companyUuid={uuid}
        visitReports={visitReports}
        contactOptions={contactOptions}
      />
    </div>
  );
};

export default CompanyVisitReportsPage;
