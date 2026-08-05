import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTimeRegistrationDetail } from "@/app/(dashboard)/time-registration/actions";
import { TimeRegistrationDetailView } from "@/components/time-registration/time-registration-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { formatDateValue, formatTimeValue } from "@/lib/helpers";

type Props = {
  params: Promise<{ uuid: string }>;
};

const TimeRegistrationDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const registration = await getTimeRegistrationDetail(uuid);

  if (!registration) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/time-registration"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Time Registration
        </Link>
      </div>
      <PageHeading
        title={registration.scanCode ?? `Scan #${registration.id}`}
        description={`${formatDateValue(registration.dateTime)} ${formatTimeValue(
          registration.dateTime,
        )}`}
      />
      <TimeRegistrationDetailView registration={registration} />
    </div>
  );
};

export default TimeRegistrationDetailPage;
