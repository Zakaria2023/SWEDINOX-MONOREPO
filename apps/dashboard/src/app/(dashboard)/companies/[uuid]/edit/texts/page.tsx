import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { CompanyTextsEditor } from "@/components/companies/edit/company-texts-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyHeader } from "../contacts/actions";
import { getTextsForCompany } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyTextsPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, texts, textCategories] = await Promise.all([
    getCompanyHeader(uuid),
    getTextsForCompany(uuid),
    getTextCategoriesForSelect(),
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
        title={`Texts — ${company.companyName}`}
        description="Add, edit, or remove text blocks printed on documents. Every change saves immediately."
      />
      <CompanyTextsEditor
        companyUuid={uuid}
        texts={texts}
        textCategories={textCategories}
      />
    </div>
  );
};

export default CompanyTextsPage;
