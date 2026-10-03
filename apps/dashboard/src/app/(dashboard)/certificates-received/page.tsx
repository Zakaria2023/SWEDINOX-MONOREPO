import { getCertificatesReceived } from "@/app/(dashboard)/certificates-received/actions";
import { CertificatesTable } from "@/components/certificates-received/certificates-table-content";

const CertificatesReceivedPage = async () => {
  const rows = await getCertificatesReceived();

  return <CertificatesTable rows={rows} />;
};

export default CertificatesReceivedPage;
