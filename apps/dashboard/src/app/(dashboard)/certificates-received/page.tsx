import { getCertificatesReceived } from "@/app/(dashboard)/certificates-received/actions";
import { CertificateFilter } from "@/components/certificates-received/certificate-filter";
import { CertificatesTable } from "@/components/certificates-received/certificates-table-content";
import { GenerateCertificatesButton } from "@/components/certificates-received/generate-certificates-button";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  searchParams: Promise<{
    receiptFrom?: string;
    receiptUntil?: string;
    companyCode?: string;
    productCode?: string;
    outstandingOnly?: string;
  }>;
};

const CertificatesReceivedPage = async ({ searchParams }: Props) => {
  const {
    receiptFrom,
    receiptUntil,
    companyCode,
    productCode,
    outstandingOnly,
  } = await searchParams;
  const showOutstandingOnly = outstandingOnly === "1";
  const rows = await getCertificatesReceived({
    receiptFrom,
    receiptUntil,
    companyCode: companyCode ? Number(companyCode) : undefined,
    productCode,
    outstandingOnly: showOutstandingOnly,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Certificates received"
          description="The mill certificate each received batch is owed, and whether it has arrived"
        />
        <GenerateCertificatesButton />
      </div>
      <CertificateFilter
        receiptFrom={receiptFrom}
        receiptUntil={receiptUntil}
        companyCode={companyCode}
        productCode={productCode}
        outstandingOnly={showOutstandingOnly}
      />
      <CertificatesTable rows={rows} />
    </div>
  );
};

export default CertificatesReceivedPage;
