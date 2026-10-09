import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * The reference edits an order on the screen it is shown on, so Edit is the
 * order's own page: the header there is the form, the toolbar above it.
 */
const EditPurchaseOrderPage = async ({ params }: Props) => {
  const { uuid } = await params;
  redirect(`/purchase-orders/${uuid}`);
};

export default EditPurchaseOrderPage;
