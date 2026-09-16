import { getCertificatesReceived } from "@/app/(dashboard)/certificates-received/actions";
import { CertificatesTable } from "@/components/certificates-received/certificates-table-content";
import { GenerateCertificatesButton } from "@/components/certificates-received/generate-certificates-button";

const CertificatesReceivedPage = async () => {
  const rows = await getCertificatesReceived();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-end gap-4">
        <GenerateCertificatesButton />
      </div>
      <CertificatesTable rows={rows} />
    </div>
  );
};

export default CertificatesReceivedPage;
