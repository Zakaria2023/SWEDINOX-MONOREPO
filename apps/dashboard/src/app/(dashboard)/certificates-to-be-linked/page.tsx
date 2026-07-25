import { getCertificatesToBeLinked } from "@/app/(dashboard)/certificates-to-be-linked/actions";
import { CertificatesToBeLinkedTable } from "@/components/certificates-to-be-linked/certificates-to-be-linked-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CertificatesToBeLinkedPage = async () => {
  const rows = await getCertificatesToBeLinked();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Certificates to be Linked"
        description="Certificates that have arrived but are not yet linked to a batch"
      />
      <CertificatesToBeLinkedTable rows={rows} />
    </div>
  );
};

export default CertificatesToBeLinkedPage;
