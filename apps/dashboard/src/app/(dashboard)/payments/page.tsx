import { getPayments } from "@/app/(dashboard)/payments/actions";
import { PaymentsTableContent } from "@/components/payments/payments-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PaymentsPage = async () => {
  const rows = await getPayments();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Payments"
        description="Money received from customers and paid to suppliers"
      />
      <PaymentsTableContent rows={rows} />
    </div>
  );
};

export default PaymentsPage;
