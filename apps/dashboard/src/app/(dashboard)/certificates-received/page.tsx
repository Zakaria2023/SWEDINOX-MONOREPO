import { getCertificatesReceived } from "@/app/(dashboard)/certificates-received/actions";
import { CertificatesTable } from "@/components/certificates-received/certificates-table-content";
import { GenerateCertificatesButton } from "@/components/certificates-received/generate-certificates-button";
import { PageHeading } from "@/components/layout/page-heading";

const CertificatesReceivedPage = async () => {
  const rows = await getCertificatesReceived();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading title="Certificates received" />
        <GenerateCertificatesButton />
      </div>
      <CertificatesTable rows={rows} />
    </div>
  );
};

export default CertificatesReceivedPage;
