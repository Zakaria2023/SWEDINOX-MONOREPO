import { getCompanyHeader } from "@/app/(dashboard)/companies/[uuid]/edit/contacts/actions";
import { CompanyFollowUpsEditor } from "@/components/companies/edit/company-follow-ups-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { currentUser } from "@clerk/nextjs/server";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFollowUpsForCompany } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

// The legacy form read the signed-in user's full name via Clerk's client-side
// useUser() to pre-fill the "By" column on new rows; here the page resolves it
// server-side with currentUser() and passes it down instead.
const CompanyFollowUpsPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, followUps, user] = await Promise.all([
    getCompanyHeader(uuid),
    getFollowUpsForCompany(uuid),
    currentUser(),
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
      <PageHeading title={`Follow-up — ${company.companyName}`} />
      <CompanyFollowUpsEditor
        companyUuid={uuid}
        currentUserName={user?.fullName ?? null}
        followUps={followUps}
      />
    </div>
  );
};

export default CompanyFollowUpsPage;
