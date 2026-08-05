import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCertificateDetail } from "@/app/(dashboard)/certificates-received/actions";
import { CertificateDetailView } from "@/components/certificates-received/certificate-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { CERTIFICAAT_LABELS } from "@/lib/labels";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CertificateDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const certificate = await getCertificateDetail(uuid);

  if (!certificate) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/certificates-received"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Certificates Received
        </Link>
      </div>
      <PageHeading
        title={
          certificate.documentCertificate
            ? CERTIFICAAT_LABELS[certificate.documentCertificate]
            : `Certificate #${certificate.id}`
        }
      />
      <CertificateDetailView certificate={certificate} />
    </div>
  );
};

export default CertificateDetailPage;
