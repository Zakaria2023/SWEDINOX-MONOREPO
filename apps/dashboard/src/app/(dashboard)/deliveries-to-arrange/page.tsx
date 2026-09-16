import { getDeliveriesToArrange } from "@/app/(dashboard)/deliveries/actions";
import { DeliveriesToArrangeTable } from "@/components/deliveries/deliveries-to-arrange-table-content";

const DeliveriesToArrangePage = async () => {
  const lines = await getDeliveriesToArrange();

  return (
    <div className="space-y-4">
      <DeliveriesToArrangeTable lines={lines} />
    </div>
  );
};

export default DeliveriesToArrangePage;
