import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getIndustryDetail } from "@/app/(dashboard)/industries/actions";
import { IndustryDetailView } from "@/components/industries/industry-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ id: string }>;
};

// Industries are keyed by their SBI code rather than a uuid, so the route param
// is that code.
const IndustryDetailPage = async ({ params }: Props) => {
  const { id } = await params;

  const industry = await getIndustryDetail(id);

  if (!industry) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/industries"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Industries
        </Link>
      </div>
      <PageHeading title={industry.name} description={`SBI ${industry.id}`} />
      <IndustryDetailView industry={industry} />
    </div>
  );
};

export default IndustryDetailPage;
