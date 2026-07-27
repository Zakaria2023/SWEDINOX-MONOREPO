import { getSendingCertificates } from "@/app/(dashboard)/sending-certificates/actions";
import { DeliveriesCertificateTable } from "@/components/deliveries-certificates/deliveries-certificate-table";
import { PageHeading } from "@/components/layout/page-heading";

const SendingCertificatesPage = async () => {
  const rows = await getSendingCertificates();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Sending Certificates"
        description="Delivered sales lines whose mill certificate has arrived and can be sent to the customer"
      />
      <DeliveriesCertificateTable
        rows={rows}
        emptyMessage="No certificates to send."
      />
    </div>
  );
};

export default SendingCertificatesPage;
