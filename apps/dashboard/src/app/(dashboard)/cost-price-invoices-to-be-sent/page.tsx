import { getCostPriceInvoicesToBeSent } from "@/app/(dashboard)/cost-price-invoices-to-be-sent/actions";
import { CostPriceInvoicesToBeSentTable } from "@/components/cost-price-invoices-to-be-sent/cost-price-invoices-to-be-sent-table-content";

const CostPriceInvoicesToBeSentPage = async () => {
  const rows = await getCostPriceInvoicesToBeSent();

  return (
    <div className="space-y-4">
      <CostPriceInvoicesToBeSentTable rows={rows} />
    </div>
  );
};

export default CostPriceInvoicesToBeSentPage;
