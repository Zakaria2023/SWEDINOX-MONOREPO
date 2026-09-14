import { getCertificatesToBeLinked } from "@/app/(dashboard)/certificates-to-be-linked/actions";
import { CertificatesToBeLinkedTable } from "@/components/certificates-to-be-linked/certificates-to-be-linked-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CertificatesToBeLinkedPage = async () => {
  const rows = await getCertificatesToBeLinked();

  return (
    <div className="space-y-4">
      <PageHeading title="Certificates to be Linked" />
      <p className="text-sm text-muted-foreground">
        This list shows certificate messages received from suppliers through
        an electronic certificate exchange, waiting to be linked to a batch.
        No exchange is connected yet, so it stays empty.
      </p>
      <CertificatesToBeLinkedTable rows={rows} />
    </div>
  );
};

export default CertificatesToBeLinkedPage;
