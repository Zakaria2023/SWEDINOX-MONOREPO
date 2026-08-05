import { getCostPriceInvoicesToBeSent } from "@/app/(dashboard)/cost-price-invoices-to-be-sent/actions";
import { CostPriceInvoicesToBeSentTable } from "@/components/cost-price-invoices-to-be-sent/cost-price-invoices-to-be-sent-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CostPriceInvoicesToBeSentPage = async () => {
  const rows = await getCostPriceInvoicesToBeSent();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Cost Price for Selling of Invoices to Be Sent" />
      <CostPriceInvoicesToBeSentTable rows={rows} />
    </div>
  );
};

export default CostPriceInvoicesToBeSentPage;
