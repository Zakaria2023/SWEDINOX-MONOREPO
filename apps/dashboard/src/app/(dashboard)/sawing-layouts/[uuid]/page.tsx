import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSawingLayoutDetail } from "@/app/(dashboard)/sawing-layouts/actions";
import { SawingLayoutDetailView } from "@/components/sawing-layouts/sawing-layout-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const SawingLayoutDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const layout = await getSawingLayoutDetail(uuid);

  if (!layout) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/sawing-layouts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Sawing Layouts
        </Link>
      </div>
      <PageHeading title={layout.sawingCode ?? `Layout #${layout.id}`} />
      <SawingLayoutDetailView layout={layout} />
    </div>
  );
};

export default SawingLayoutDetailPage;
