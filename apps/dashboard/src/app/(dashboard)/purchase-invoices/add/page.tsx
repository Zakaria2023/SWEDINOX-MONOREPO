import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import {
  getContactsForSuppliers,
  getSuppliersForSelect,
} from "@/app/(dashboard)/companies/actions";
import { PurchaseInvoiceForm } from "@/components/purchase-invoices/purchase-invoice-form";

const AddPurchaseInvoicePage = async () => {
  const [availableSuppliers, availableContacts] = await Promise.all([
    getSuppliersForSelect(),
    getContactsForSuppliers(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/purchase-invoices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Purchase Invoices
        </Link>
      </div>
      <PurchaseInvoiceForm
        availableSuppliers={availableSuppliers}
        availableContacts={availableContacts}
      />
    </div>
  );
};

export default AddPurchaseInvoicePage;
