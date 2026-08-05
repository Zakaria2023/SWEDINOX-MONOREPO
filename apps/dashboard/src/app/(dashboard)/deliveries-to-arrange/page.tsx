import { getDeliveriesToArrange } from "@/app/(dashboard)/deliveries/actions";
import { DeliveriesToArrangeTable } from "@/components/deliveries/deliveries-to-arrange-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const DeliveriesToArrangePage = async () => {
  const lines = await getDeliveriesToArrange();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Deliveries to be arranged without stock reservation" />
      <DeliveriesToArrangeTable lines={lines} />
    </div>
  );
};

export default DeliveriesToArrangePage;
