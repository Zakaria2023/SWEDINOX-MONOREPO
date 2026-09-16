import { getSendingCertificates } from "@/app/(dashboard)/sending-certificates/actions";
import { DeliveriesCertificateTable } from "@/components/deliveries-certificates/deliveries-certificate-table";

const SendingCertificatesPage = async () => {
  const rows = await getSendingCertificates();

  return (
    <div className="space-y-4">
      <DeliveriesCertificateTable
        rows={rows}
        emptyMessage="No certificates to send."
      />
    </div>
  );
};

export default SendingCertificatesPage;
