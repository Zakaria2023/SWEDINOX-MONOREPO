import PurchaseOrderDetailPage from "../page";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * The reference edits an order on the screen it is shown on, so Edit is the
 * order's own page: the header there is the form, the toolbar above it.
 */
const EditPurchaseOrderPage = ({ params }: Props) => (
  <PurchaseOrderDetailPage params={params} />
);

export default EditPurchaseOrderPage;
