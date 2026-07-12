import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { CounterOrderForm } from "@/components/counter-orders/counter-order-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddCounterOrderPage = async () => {
  const companies = await getCompaniesForSelect();

  return (
    <div className="max-w-5xl space-y-6 p-6">
      <div>
        <Link
          href="/counter-orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Counter Orders
        </Link>
      </div>
      <PageHeading
        title="New Counter Order"
        description="Create an order taken at the counter."
      />
      <CounterOrderForm companies={companies} />
    </div>
  );
};

export default AddCounterOrderPage;
