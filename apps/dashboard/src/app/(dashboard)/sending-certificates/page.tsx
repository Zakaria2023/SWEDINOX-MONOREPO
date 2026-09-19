import {
  exportSendingCertificates,
  getSendingCertificates,
} from "@/app/(dashboard)/sending-certificates/actions";
import { DeliveriesCertificateTable } from "@/components/deliveries-certificates/deliveries-certificate-table";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const SendingCertificatesPage = async ({ searchParams }: Props) => {
  const page = await getSendingCertificates(
    parseTableQuery(await searchParams),
  );

  return (
    <div className="space-y-4">
      <DeliveriesCertificateTable
        rows={page.rows}
        page={page}
        emptyMessage="No certificates to send. Try clearing the search or the filters."
        exportAction={exportSendingCertificates}
        exportFileName="sending-certificates"
      />
    </div>
  );
};

export default SendingCertificatesPage;
