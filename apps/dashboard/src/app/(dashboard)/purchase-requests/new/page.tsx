import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getYardDeliveryAddress } from "@/app/(dashboard)/purchase-orders/actions";
import { DEFAULT_PURCHASE_REQUEST } from "@/app/(dashboard)/purchase-requests/validation";
import {
  currentYear,
  dateStringInDays,
  isoWeekOf,
  todayDateString,
} from "@/lib/helpers";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { PurchaseRequestForm } from "@/components/purchase-requests/purchase-request-form";

const NewPurchaseRequestPage = async () => {
  const [companies, clerkUsers, yard] = await Promise.all([
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
    getYardDeliveryAddress(),
  ]);

  // A new request is delivered to our own yard, as the reference prefills
  // `Bolderweg 10, 1332AT, Almere`. The dates are taken per request, not from
  // when the module was loaded.
  const defaultValues = {
    ...DEFAULT_PURCHASE_REQUEST,
    deliveryAddressUuid: yard?.uuid ?? "",
    deliveryWeek: String(isoWeekOf(todayDateString()) ?? ""),
    deliveryYear: String(currentYear()),
    deadline: dateStringInDays(1),
  };

  return (
    <div className="space-y-4">
      <PurchaseRequestForm
        companies={companies}
        clerkUsers={clerkUsers}
        defaultValues={defaultValues}
      />
    </div>
  );
};

export default NewPurchaseRequestPage;
