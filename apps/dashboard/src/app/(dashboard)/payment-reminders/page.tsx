import { getPaymentReminders } from "@/app/(dashboard)/payment-reminders/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { PaymentRemindersTable } from "@/components/payment-reminders/payment-reminders-table-content";

const PaymentRemindersPage = async () => {
  const reminders = await getPaymentReminders();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Payment reminders" />
      <PaymentRemindersTable reminders={reminders} />
    </div>
  );
};

export default PaymentRemindersPage;
